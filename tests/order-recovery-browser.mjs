import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import process from "node:process";
const origin = process.env.ORDER_ORIGIN || "http://127.0.0.1:5185";
const order = {
  id: "00000000-0000-4000-8000-000000000099",
  status: "shipped",
  totalCents: 1500,
  creditCents: 0,
  rewardCents: 0,
  address: {
    recipient: "Fixture",
    line1: "Test",
    city: "Test",
    province: "QC",
    postalCode: "H0H0H0",
  },
  messages: [],
  groups: [
    {
      id: "fixture-group",
      status: "shipped",
      refundedCents: 0,
      tracking: "FIXTURE",
      fee: {
        commissionCents: 50,
        processingCents: 10,
        promotedCents: 0,
        netCents: 1440,
      },
      quote: {
        seller: { name: "Fixture store" },
        cards: 1,
        shipping: { cents: 500, tracked: true },
        lines: [],
      },
    },
  ],
};
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const lang of ["en", "fr"])
    for (const side of ["account", "seller"]) {
      const page = await browser.newPage({
        viewport: { width: lang === "fr" ? 390 : 1440, height: 900 },
      });
      let postStatus = 503,
        getStatus = 200,
        posts = 0;
      await page.route("**/api/commerce/**", async (route) => {
        const post = route.request().method() === "POST";
        if (post) posts++;
        const status = post ? postStatus : getStatus;
        await route.fulfill({
          status,
          json:
            status === 200
              ? post
                ? { ok: true }
                : order
              : {
                  code:
                    status === 401
                      ? "unauthorized"
                      : status === 403
                        ? "forbidden"
                        : "service_unavailable",
                },
        });
      });
      await page.goto(`${origin}/${side}/orders/${order.id}?lang=${lang}`);
      const body = page.locator('textarea[name="body"]');
      const send = body.locator("../..").getByRole("button");
      await body.fill("Preserve this draft on failure");
      await send.click();
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(body).toHaveValue("Preserve this draft on failure");
      await expect(
        page.getByRole("alert").locator('a[href^="/sign-in"]'),
      ).toHaveCount(0);
      assert.equal(posts, 1);
      // A confirmed POST clears the submitted draft even if the subsequent read fails.
      postStatus = 200;
      getStatus = 503;
      await send.click();
      await expect(body).toHaveValue("");
      await expect(page.getByRole("alert")).toBeVisible();
      assert.equal(posts, 2);
      getStatus = 200;
      await page.getByRole("alert").getByRole("button").click();
      await expect(page.getByRole("alert")).toHaveCount(0);
      assert.equal(posts, 2, "Read retry must not repeat a mutation");
      for (const status of [401, 403, 503]) {
        getStatus = status;
        await page.reload();
        await expect(page.getByRole("alert")).toBeVisible();
        await expect(
          page.getByRole("alert").locator('a[href^="/sign-in"]'),
        ).toHaveCount(status === 401 ? 1 : 0);
      }
      await page.close();
    }
  console.log(
    "4 EN/FR buyer/seller order recovery cases passed; all API responses intercepted, no messages sent.",
  );
} finally {
  await browser.close();
}
