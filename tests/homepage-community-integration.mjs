import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [1440, "fr", "light"],
    [768, "en", "light"],
    [768, "fr", "dark"],
    [390, "fr", "dark"],
    [320, "en", "light"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 1100 },
      reducedMotion: "reduce",
    });
    await page.addInitScript(
      ({ lang, theme }) => {
        globalThis.localStorage.setItem("troc.locale", lang);
        globalThis.localStorage.setItem("troc.theme", theme);
      },
      { lang, theme },
    );
    await page.goto(`http://127.0.0.1:4313/?lang=${lang}`);
    await expect(page.locator("[aria-busy]").first()).toHaveAttribute("aria-busy", "false");
    const selectors = [".troc-hc-about", ".troc-hc-community", ".troc-hc-cta"];
    await expect(
      page.locator(".troc-about-home,.troc-community-grid,.troc-final-edit"),
    ).toHaveCount(0);
    await expect(page.locator(".troc-hc-about-features article")).toHaveCount(
      4,
    );
    await expect(page.locator(".troc-hc-seller")).toHaveCount(3);
    await expect(page.locator(".troc-hc-cta-disclaimer")).toBeVisible();
    for (const location of await page.locator(".troc-hc-seller-location").allTextContents()) {
      assert.ok(location.trim() && !/^,|,$/.test(location.trim()), "Location badges contain actual public location text");
    }
    for (const card of await page.locator(".troc-hc-seller").all()) {
      await expect(card.locator(".troc-hc-seller-samples > div")).toHaveCount(3);
      assert.equal(await card.locator(".troc-hc-seller-cover .troc-card-image").count(), 0, "Do not substitute a product image for store branding");
    }
    assert.deepEqual(await page.locator(".troc-hc-seller h3").allTextContents(), ["Card Forge TCG", "Piko Trading Cards", "The Playground"]);
    for (const link of await page.locator(".troc-hc-seller").all()) {
      assert.ok(!(await link.getAttribute("href")).includes("local-test-store"));
    }
    let bottom = 0;
    for (const selector of selectors) {
      const section = page.locator(selector);
      await expect(section).toHaveCount(1);
      await section.scrollIntoViewIfNeeded();
      for (const img of await section.locator("img").all()) {
        await img.scrollIntoViewIfNeeded();
        await expect(img).toHaveJSProperty("complete", true);
        assert.ok(await img.evaluate((e) => e.naturalWidth > 0));
      }
      const bounds = await section.evaluate((e) => {
        const b = e.getBoundingClientRect();
        return {
          top: b.top + globalThis.scrollY,
          bottom: b.bottom + globalThis.scrollY,
          left: b.left,
          right: b.right,
        };
      });
      assert.ok(bounds.top > bottom);
      bottom = bounds.bottom;
      assert.ok(bounds.left >= 12 && bounds.right <= width - 12);
      for (const link of await section.locator("a").all()) {
        await link.focus();
        await expect(link).toBeFocused();
        assert.equal(
          new URL(await link.getAttribute("href"), page.url()).searchParams.get(
            "lang",
          ),
          lang,
        );
      }
      await page.evaluate(() => globalThis.document.activeElement.blur());
      await section.scrollIntoViewIfNeeded();
      await section.screenshot({
        path: `verification/community-${selector.slice(9)}-${width}-${lang}-${theme}.jpg`,
        style: ".troc-marketplace-header-frame,.troc-skip{visibility:hidden!important}",
      });
    }
    assert.equal(
      await page.evaluate(
        () => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth,
      ),
      false,
    );
    const footer = await page
      .locator("footer")
      .last()
      .evaluate((e) => e.getBoundingClientRect().top + globalThis.scrollY);
    assert.ok(footer >= bottom);
    await page.locator(".troc-hc-cta").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `verification/community-context-${width}-${lang}-${theme}.jpg`,
    });
    const routes = [];
    if (width === 1440) {
      const links = await page.locator(".troc-hc a").evaluateAll((es) =>
        es.map((e) => ({
          href: e.getAttribute("href"),
          text: e.textContent,
        })),
      );
      for (const link of links) {
        await page.goto(`http://127.0.0.1:4313/?lang=${lang}`);
        const target = page.locator(`.troc-hc a[href='${link.href}']`);
        await target.focus();
        await page.keyboard.press("Enter");
        await page.waitForURL(new URL(link.href, "http://127.0.0.1:4313").href);
        await expect(page.locator("h1")).not.toBeEmpty();
        await expect(page.locator("h1")).not.toHaveText(/Loading|Chargement/i);
        const heading = await page.locator("h1").innerText();
        assert.ok(!/404|not found|introuvable/i.test(heading));
        await expect(page.locator(".troc-hc-about")).toHaveCount(0);
        routes.push({ href: link.href, heading });
      }
    }
    results.push({ width, lang, theme, routes, result: "PASS" });
    await page.close();
  }
  await fs.writeFile(
    "verification/community-integration.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
