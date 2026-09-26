
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const seller = {
  id: "00000000-0000-4000-8006-000000000000",
  name: "Cartes du Nord",
  slug: "cartes-du-nord",
  minimumCents: 0,
  handlingDays: 1,
  reputation: 0,
  badges: [],
  freeShippingCents: null,
  promotions: [],
};
const listing = {
  id: "fixture-line",
  sellerId: seller.id,
  name: { en: "Pidgey", fr: "Pidgey" },
  slug: "pokemon-pidgey-05c50488",
  variantId: "fixture-variant",
  language: "en",
  variantKey: "standard",
  collectorNumber: "016",
  condition: "NM",
  productType: "raw_single",
  quantity: 10,
  demo: true,
  imageUrl: null,
};
const serverLines = [{ listingId: listing.id, quantity: 1, lockSeller: true }];
const quote = (lines) => {
  const cards = lines.reduce((sum, line) => sum + line.quantity, 0);
  return {
    groups: cards
      ? [
          {
            seller,
            lines: lines.map((line) => ({
              ...line,
              listing: { ...listing, id: line.listingId },
              unitCents: 5,
              totalCents: line.quantity * 5,
            })),
            cards,
            merchandiseCents: cards * 5,
            discountCents: 0,
            promotionId: null,
            nextPromotion: null,
            minimumRemainingCents: 0,
            freeShippingRemainingCents: null,
            shipping: { serviceId: "fixture", cents: 100, tracked: false },
            totalCents: cards * 5 + 100,
          },
        ]
      : [],
    cards,
    merchandiseCents: cards * 5,
    discountCents: 0,
    shippingCents: cards ? 100 : 0,
    taxCents: 0,
    creditCents: 0,
    totalCents: cards ? cards * 5 + 100 : 0,
    eligible: true,
    demo: true,
    currency: "CAD",
  };
};
const results = [];
try {
  for (const [lang, width, authenticated] of [["en",1440,true],["fr",390,true],["en",1440,false],["fr",390,false]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const previewLines = [{ ...serverLines[0], listingId: "fixture-preview" }];
    const appliedLines = [{ ...serverLines[0], listingId: "fixture-applied" }];
    const result = lines => ({ original: quote(serverLines), optimized: quote(lines), lines, savingsCents: 0, shippingSavingsCents: 0, substitutions: [] });
    let applies = 0;
    let quoted = [];
    await page.addInitScript(lines => localStorage.setItem("troc.cart.v1", JSON.stringify(lines)), serverLines);
    await page.route("**/api/commerce/**", async route => {
      const request = route.request(), path = new URL(request.url()).pathname;
      if (path.endsWith("/cart") && request.method() === "GET")
        return route.fulfill(authenticated ? {json:{lines:serverLines,coupon:"",creditCents:0}} : {status:401,json:{code:"unauthorized"}});
      if (path.endsWith("/quote")) {
        quoted = request.postDataJSON().lines;
        return route.fulfill({json:quote(quoted)});
      }
      if (path.endsWith("/smart")) return route.fulfill({json:result(previewLines)});
      if (path.endsWith("/smart/apply")) {
        applies++;
        assert.deepEqual(request.postDataJSON().lines, serverLines);
        return route.fulfill(applies === 1 ? {status:503,json:{code:"error"}} : {json:result(appliedLines)});
      }
      return route.fulfill({status:400,json:{code:"unexpected_test_request"}});
    });
    await page.goto("http://127.0.0.1:4313/smart-cart?lang="+lang);
    const optimize = page.getByRole("button",{name:lang==="fr"?"Optimiser le coût total":"Optimize landed cost",exact:true});
    await expect(optimize).toBeEnabled();
    await optimize.click();
    const apply = page.getByRole("button",{name:lang==="fr"?"Utiliser ce panier":"Use this cart",exact:true});
    await expect(apply).toBeEnabled();
    if (authenticated) {
      await apply.click();
      await expect(apply).toBeEnabled();
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem("troc.cart.v1"))),serverLines);
    }
    await apply.click();
    const expected = authenticated ? appliedLines : previewLines;
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem("troc.cart.v1")))).toEqual(expected);
    await expect.poll(()=>quoted).toEqual(expected);
    await expect(apply).toHaveCount(0);
    await expect(optimize).toBeEnabled();
    assert.equal(applies,authenticated?2:0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    results.push({lang,width,authenticated,failurePreservesCart:authenticated,authoritativeApply:authenticated,guestPreviewOnly:!authenticated,locksPreserved:true,freshQuote:true});
    await page.close();
  }
  const fs = await import("node:fs");
  fs.mkdirSync("docs/evidence/smart-apply-currentness",{recursive:true});
  fs.writeFileSync("docs/evidence/smart-apply-currentness/check.json",JSON.stringify(results,null,2));
  console.log(results);
} finally { await browser.close(); }

