import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import process from "node:process";
const origin = process.env.PRELAUNCH_ORIGIN || "http://127.0.0.1:5322";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const locale of ["en", "fr"]) {
    const ctx = await browser.newContext();
    let revision = 1,
      cohort = "unassigned",
      failure = "lead_conflict";
    const patches = [];
    await ctx.route("**/api/prelaunch/**", async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      let body = {},
        status = 200;
      if (url.pathname.endsWith("/sessions")) body = { token: "fixture-token" };
      if (url.pathname.endsWith("/metrics")) body = { events: [] };
      if (url.pathname.endsWith("/leads") && req.method() === "GET")
        body = [
          {
            id: "fixture",
            email: "local@example.test",
            details: {},
            acquisition: { source: "direct" },
            cohort,
            lead_status: "new",
            revision,
            unsubscribed_at: null,
          },
        ];
      if (req.method() === "PATCH") {
        patches.push(req.postDataJSON());
        status =
          failure === "lead_conflict"
            ? 409
            : failure === "forbidden"
              ? 403
              : failure === "unauthorized"
                ? 401
                : 503;
        body = { code: failure };
      }
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });
    const page = await ctx.newPage();
    for (const kind of ["collector", "seller"]) {
      await page.goto(
        `${origin}/early-access/${kind}?lang=${locale}&source=event&ref=fixture01`,
      );
      await page.locator("[name=email]").fill("local@example.test");
      await page.locator("[name=province]").selectOption("QC");
      if (kind === "seller") {
        await page.locator("[name=contact]").fill("Local");
        await page.locator("[name=inventory]").selectOption("1000_9999");
        await page.locator("[name=sellerType]").selectOption("individual");
        await page.locator("[name=experience]").selectOption("1_3_years");
        await page.locator("[name=adult]").check();
      }
      await page.locator("[name=country]").check();
      await page.locator("[name=consent]").check();
      await page.locator("form button[type=submit]").click();
      const receipt = page.locator("[role=status] input[readonly]");
      await receipt.waitFor();
      assert.equal((await receipt.inputValue()).length, 43);
      await receipt.focus();
      assert.equal(
        await receipt.evaluate((el) => el.selectionEnd - el.selectionStart),
        43,
      );
      for (const href of await page
        .locator('a[href*="early-access"]')
        .evaluateAll((nodes) => nodes.map((n) => n.href))) {
        const url = new URL(href);
        assert.equal(url.searchParams.get("lang"), locale);
        assert.equal(url.searchParams.get("source"), "event");
        assert.equal(url.searchParams.get("ref"), "fixture01");
      }
      await page.locator("footer a").click();
      await page.locator("[name=withdrawal]").waitFor();
      assert.equal(new URL(page.url()).searchParams.get("lang"), locale);
      assert.equal(
        await page.locator(".prelaunch-shell").getAttribute("lang"),
        locale,
      );
    }
    await page.goto(`${origin}/early-access/admin?lang=${locale}`);
    await page.locator("form").first().locator("button[type=submit]").click();
    await page.locator("article").waitFor();
    await page.locator("article select[name=cohort]").selectOption("internal");
    await page.locator("article button[type=submit]").click();
    await page.getByRole("alert").waitFor();
    assert.match(
      await page.getByRole("alert").innerText(),
      locale === "fr" ? /n’a pas été enregistrée/ : /was not saved/,
    );
    assert.equal(patches[0].revision, 1);
    revision = 2;
    cohort = "private_alpha";
    await page
      .getByRole("button", {
        name:
          locale === "fr"
            ? "Recharger les données actuelles"
            : "Reload latest data",
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector("article select[name=cohort]")?.value ===
        "private_alpha",
    );
    for (const code of ["unauthorized", "forbidden", "service_unavailable"]) {
      failure = code;
      await page.locator("article button[type=submit]").click();
      await page.getByRole("alert").waitFor();
      const text = await page.getByRole("alert").innerText();
      assert.match(
        text,
        code === "unauthorized"
          ? locale === "fr"
            ? /Connectez/
            : /Sign in/
          : code === "forbidden"
            ? /administrat/
            : locale === "fr"
              ? /temporairement/
              : /temporarily/,
      );
    }
    assert.equal(patches.at(-1).revision, 2);
    await ctx.close();
  }
  console.log(
    "Prelaunch UX: EN/FR capture code selection, locale/source/ref navigation, conflict reload/revision and access error distinctions PASS",
  );
} finally {
  await browser.close();
}
