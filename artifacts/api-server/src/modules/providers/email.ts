import { createElement as h } from "react";
import { render, toPlainText } from "@react-email/render";
import { Resend } from "resend";
import type { EmailProvider } from "./contracts";

type Input = Parameters<EmailProvider["send"]>[0];
type Payload = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};
export type EmailTransport = (
  payload: Payload,
  key: string,
) => Promise<{ id: string }>;
export type EmailConfiguration = {
  enabled?: boolean;
  apiKey?: string;
  from?: string;
  appOrigin: string;
};

function origin(value: string, live = false) {
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        !live &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      ))
  )
    throw new Error("invalid_email_origin");
  return url.origin;
}
function short(value: unknown, max: number) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > max ||
    Array.from(value).some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
    )
  )
    throw new Error("invalid_email_input");
  return value.trim();
}
function mailbox(value: unknown) {
  const text = short(value, 254);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(text))
    throw new Error("invalid_email_address");
  return text;
}

// Fixed destinations: callers cannot inject subjects, URLs or HTML.
export async function renderTransactionalEmail(
  input: Input,
  appOrigin: string,
) {
  if (input.locale !== "en" && input.locale !== "fr")
    throw new Error("invalid_email_locale");
  const fr = input.locale === "fr";
  let subject: string, title: string, description: string, path: string;
  if (input.template === "order_update") {
    subject = fr
      ? "Votre commande TROC a été mise à jour"
      : "Your TROC order has been updated";
    title = fr ? "Du nouveau pour votre commande" : "An update on your order";
    description = fr
      ? "Consultez votre compte pour voir les derniers détails de votre commande."
      : "Visit your account to see the latest details for your order.";
    path = "/account/orders";
  } else if (input.template === "enquiry_received") {
    subject = fr ? "Un nouveau message sur TROC" : "A new message on TROC";
    title = fr ? "Votre conversation continue" : "Keep the conversation going";
    description = fr
      ? "Un nouveau message vous attend dans votre espace vendeur."
      : "A new message is waiting in your seller workspace.";
    path = "/seller/messages";
  } else throw new Error("unsupported_email_template");
  const name =
    input.parameters.displayName === undefined
      ? undefined
      : short(input.parameters.displayName, 100);
  if (Object.keys(input.parameters).some((key) => key !== "displayName"))
    throw new Error("invalid_email_parameters");
  const href = origin(appOrigin) + path + "?lang=" + input.locale;
  const button = fr ? "Ouvrir mon compte" : "Open my account";
  const cell = h(
    "td",
    { style: { padding: "32px" } },
    h(
      "p",
      {
        style: {
          color: "#d90825",
          fontWeight: 800,
          fontSize: "24px",
          margin: "0 0 32px",
        },
      },
      "TROC",
    ),
    name && h("p", null, (fr ? "Bonjour " : "Hi ") + name + ","),
    h(
      "h1",
      { style: { fontSize: "26px", lineHeight: "34px", margin: "0 0 16px" } },
      title,
    ),
    h(
      "p",
      { style: { fontSize: "16px", lineHeight: "26px", marginBottom: "28px" } },
      description,
    ),
    h(
      "a",
      {
        href,
        style: {
          display: "inline-block",
          backgroundColor: "#d90825",
          color: "#ffffff",
          padding: "14px 22px",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: 700,
        },
      },
      button,
    ),
    h(
      "p",
      {
        style: {
          fontSize: "12px",
          lineHeight: "20px",
          color: "#666666",
          marginTop: "32px",
        },
      },
      fr
        ? "Un message de service concernant votre compte TROC."
        : "A service message about your TROC account.",
    ),
  );
  const card = h(
    "table",
    {
      role: "presentation",
      width: "100%",
      cellPadding: 0,
      cellSpacing: 0,
      style: {
        maxWidth: "560px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
      },
    },
    h("tbody", null, h("tr", null, cell)),
  );
  const html = await render(
    h(
      "html",
      { lang: input.locale },
      h(
        "head",
        null,
        h("meta", { charSet: "utf-8" }),
        h("meta", {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        }),
      ),
      h(
        "body",
        {
          style: {
            margin: 0,
            backgroundColor: "#f4f4f4",
            fontFamily: "Arial, sans-serif",
            color: "#181818",
          },
        },
        h(
          "table",
          {
            role: "presentation",
            width: "100%",
            cellPadding: 0,
            cellSpacing: 0,
          },
          h(
            "tbody",
            null,
            h(
              "tr",
              null,
              h(
                "td",
                { align: "center", style: { padding: "32px 16px" } },
                card,
              ),
            ),
          ),
        ),
      ),
    ),
  );
  return { subject, html, text: toPlainText(html) };
}

export function createTransactionalEmailProvider(
  config: EmailConfiguration,
  transport?: EmailTransport,
): EmailProvider {
  // Disabled means no client construction, no delivery and no fake success.
  if (config.enabled !== true)
    return {
      async send() {
        throw new Error("email_delivery_disabled");
      },
    };
  origin(config.appOrigin, true);
  const from = mailbox(config.from);
  if (!config.apiKey?.trim()) throw new Error("email_configuration_missing");
  const client = transport ? undefined : new Resend(config.apiKey);
  const deliver: EmailTransport =
    transport ??
    (async (payload, key) => {
      const response = await client!.emails.send(payload, {
        idempotencyKey: key,
      });
      if (response.error || !response.data?.id)
        throw new Error("email_delivery_failed");
      return { id: response.data.id };
    });
  return {
    async send(input) {
      const recipient = mailbox(input.recipient);
      const key = short(input.idempotencyKey, 256);
      if (!/^[a-zA-Z0-9:_-]+$/.test(key))
        throw new Error("invalid_email_idempotency_key");
      const rendered = await renderTransactionalEmail(input, config.appOrigin);
      let result: { id: string };
      try {
        result = await deliver({ from, to: recipient, ...rendered }, key);
      } catch {
        throw new Error("email_delivery_failed");
      }
      if (!result?.id || typeof result.id !== "string")
        throw new Error("email_delivery_failed");
      return { messageId: result.id };
    },
  };
}
