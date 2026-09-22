import { api } from "../../api";
type Audience = "landing" | "collector" | "seller";
type Journey = {
  token: string;
  kind: Audience;
  analytics: boolean;
  expires: number;
};
const key = "troc.prelaunch.journey";
let memory: Journey | null = null;
let pending: Promise<unknown> = Promise.resolve();
function read(): Journey | null {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(key) ?? "null",
    ) as Journey | null;
    if (
      stored &&
      typeof stored.token === "string" &&
      stored.expires > Date.now() &&
      ["landing", "collector", "seller"].includes(stored.kind)
    )
      return stored;
  } catch {
    /* Storage can be unavailable; use this page's memory only. */
  }
  return memory && memory.expires > Date.now() ? memory : null;
}
function save(value: Journey) {
  memory = value;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Functional capture still works without storage. */
  }
}
export function analyticsPreference() {
  return read()?.analytics === true;
}
export function journey(kind: Audience, analytics: boolean): Promise<Journey> {
  const work = async () => {
    let current = read();
    if (
      current &&
      kind !== "landing" &&
      current.kind !== "landing" &&
      current.kind !== kind
    )
      current = null;
    if (!current) {
      const query = new URLSearchParams(window.location.search),
        source = query.get("source") ?? "direct";
      const result = await api<{ token: string }>(
        "/prelaunch/sessions",
        "POST",
        {
          kind,
          source: [
            "direct",
            "newsletter",
            "social",
            "event",
            "partner",
          ].includes(source)
            ? source
            : "direct",
          referral: query.get("ref")?.slice(0, 64) ?? "",
          analyticsConsent: analytics,
        },
      );
      current = {
        token: result.token,
        kind,
        analytics,
        expires: Date.now() + 23 * 60 * 60 * 1000,
      };
      save(current);
    } else {
      const selected = kind === "landing" ? current.kind : kind;
      if (current.analytics !== analytics || current.kind !== selected) {
        await api("/prelaunch/session-preferences", "POST", {
          token: current.token,
          kind: selected,
          analyticsConsent: analytics,
        });
        current = { ...current, kind: selected, analytics };
        save(current);
      }
    }
    return current;
  };
  const result = pending.then(work, work);
  pending = result.catch(() => undefined);
  return result;
}
export async function observe(
  j: Journey,
  name: "landing_visit" | "cta" | "form_start",
) {
  if (j.analytics)
    await api("/prelaunch/events", "POST", { token: j.token, name });
}
