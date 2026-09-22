/**
 * Read-only catalog/render checks against the running guide.
 * Start Chromium with --headless --no-sandbox --remote-debugging-port=9222.
 * Usage: node scripts/check-style-guide.mjs https://<dev-domain>/style-guide
 */
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { connectBrowser } from "./browser-client.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const families = readdirSync(`${root}src/components/ui`).filter((name) => name.endsWith(".tsx")).map((name) => name.slice(0, -4)).sort();
const stories = readdirSync(`${root}src/preview/demos`).filter((name) => name.endsWith(".tsx")).map((name) => name.slice(0, -4)).sort();
assert.equal(families.length, 46, "The complete source inventory contains 46 normalized families.");
assert.deepEqual(stories, families, "Each component family has exactly one matching story.");

const base = process.argv[2];
if (!base) throw new Error("Supply the running style-guide URL.");
const browser = await connectBrowser();
const { send, evaluate, wait, page } = browser;
try {
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await browser.navigate(base);
  await wait("!!document.querySelector('main h1')");
  const pages = await evaluate("[...document.querySelectorAll('.ds-sidebar nav a')].map(a=>a.getAttribute('href').split('=')[1])");
  assert.equal(new Set(pages).size, pages.length, "No duplicate guide entries.");
  await page("overview");
  assert.equal(await evaluate("document.querySelectorAll('.ds-directory-group li').length"), 46, "All 46 families appear in the overview directory.");
  console.log(`Catalog: ${families.length} families, ${pages.length} guide pages.`);

  const issues = [];
  // All pages at each target width; longest language/light theme at phone size.
  for (const { width, language, theme } of [
    { width: 390, language: "en", theme: "dark" },
    { width: 768, language: "en", theme: "dark" },
    { width: 1280, language: "en", theme: "dark" },
    { width: 1920, language: "en", theme: "dark" },
    { width: 390, language: "fr", theme: "light" },
  ]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 820 });
    await send("Emulation.setTouchEmulationEnabled", { enabled: width < 820 });
    await evaluate(`document.querySelector('.ds-topbar .ds-language button[lang="${language}"]').click(); document.querySelector('.ds-topbar .ds-theme-control button:${theme === "light" ? "first" : "last"}-child').click()`);
    await wait(`document.documentElement.lang==='${language}-CA' && document.documentElement.classList.contains('${theme}')`);
    for (const id of pages) {
      await page(id);
      await evaluate("document.querySelectorAll('main img').forEach(img=>img.loading='eager')");
      await wait("[...document.querySelectorAll('main img')].every(img=>img.complete)");
      // BrandImage is deliberately width-sized in the foundation gallery.
      // Public component logos retain their explicit height contract.
      const state = await evaluate(`({
        viewport:document.documentElement.clientWidth,
        width:document.documentElement.scrollWidth,
        broken:[...document.querySelectorAll('main img')].filter(img=>!img.naturalWidth).map(img=>img.getAttribute('src')),
        oversizedLogos:[...document.querySelectorAll('main .troc-logo:not(.ds-brand-logo) .troc-logo-img')].filter(img=>img.getClientRects().length && img.getBoundingClientRect().height>parseFloat(getComputedStyle(img).getPropertyValue('--troc-logo-height'))+1).map(img=>img.closest('.troc-logo').className),
        clippedHeaderControls:[...document.querySelectorAll('main .troc-site-header button,main .troc-site-header input,main .troc-mobile-topbar button,main .troc-mobile-topbar input')].filter(el=>{if(!el.getClientRects().length)return false;const r=el.getBoundingClientRect(),p=el.closest('.troc-site-header,.troc-mobile-topbar').getBoundingClientRect();return r.left<p.left-1||r.right>p.right+1}).map(el=>el.getAttribute('aria-label')||el.textContent.trim()),
        unexpectedOverlay:!!document.querySelector('[data-radix-popper-content-wrapper] [role=menu], [role=dialog][data-state=open]'),
        fallback:!!document.querySelector('main > .ds-notice[role="alert"]')
      })`);
      if (state.width > state.viewport + 1 || state.broken.length || state.oversizedLogos.length || state.clippedHeaderControls.length || state.unexpectedOverlay || state.fallback) issues.push({ id, width, language, theme, ...state });
    }
    console.log(`Rendered ${pages.length} pages at ${width}px / ${language} / ${theme}.`);
  }
  assert.deepEqual(issues, [], `Rendering issues: ${JSON.stringify(issues)}`);
  assert.deepEqual(browser.errors, [], "No uncaught browser errors.");
  console.log("PASS: family/story/navigation coverage, responsive layout, images, themes, French expansion, and runtime checks.");
} finally {
  browser.close();
}