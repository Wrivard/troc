import { chromium, expect } from "@playwright/test";
const b = await chromium.launch({ channel: "msedge", headless: true });
const id = "11111111-1111-4111-8111-111111111111";
try {
  for (const lang of ["en", "fr"]) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.route("**/api/account", (r) =>
      r.fulfill({
        json: {
          id,
          email: "fixture@example.test",
          locale: lang,
          theme: "light",
        },
      }),
    );
    await p.goto(`http://localhost:4313/account?lang=${lang}`);
    const field = p.getByLabel(
      lang === "fr" ? "Identifiant du compte" : "Account ID",
      { exact: true },
    );
    await expect(field).toHaveValue(id);
    await expect(field).toHaveAttribute("readonly", "");
    await field.focus();
    await field.press("Control+a");
    await expect(field).toBeFocused();
    await p.close();
  }
  console.log(
    "EN/FR authenticated-response fixture: account ID visible and read-only",
  );
} finally {
  await b.close();
}
