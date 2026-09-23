import { Buffer } from "node:buffer";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sharp from "sharp";
import {
  boundedFraming,
  coverGeometry,
  demoCoverRules,
  validateCoverDimensions,
  validateCoverFile,
} from "../artifacts/marketplace/src/modules/store-cover-editor/crop.ts";
let geometryCases = 0;
for (const [w, h] of [
  [1600, 600],
  [800, 1200],
  [1200, 800],
  [1000, 1000],
])
  for (const ratio of [2.5, 16 / 9])
    for (const x of [0, 50, 100])
      for (const y of [0, 50, 100])
        for (const zoom of [1, 1.75, 3]) {
          const g = coverGeometry(w, h, ratio, { x, y, zoom });
          assert.ok(
            g.width >= 100 - 1e-8 &&
              g.height >= 100 - 1e-8 &&
              g.left <= 1e-8 &&
              g.top <= 1e-8 &&
              g.left + g.width >= 100 - 1e-8 &&
              g.top + g.height >= 100 - 1e-8,
          );
          assert.ok(Math.abs((g.width * ratio) / g.height - w / h) < 1e-8);
          geometryCases++;
        }
assert.deepEqual(boundedFraming({ x: -20, y: 120, zoom: 0 }), {
  x: 0,
  y: 100,
  zoom: 1,
});
assert.deepEqual(coverGeometry(2000, 1000, 2.5, { x: 50, y: 100, zoom: 1 }), {
  width: 100,
  height: 125,
  left: 0,
  top: -25,
});
assert.throws(() => coverGeometry(0, 1000, 2.5, { x: 50, y: 50, zoom: 1 }));
assert.equal(
  validateCoverFile({ type: "image/svg+xml", size: 100 }, demoCoverRules),
  "type",
);
assert.equal(
  validateCoverFile(
    { type: "image/jpeg", size: 11 * 1024 * 1024 },
    demoCoverRules,
  ),
  "size",
);
assert.equal(
  validateCoverDimensions(10000, 10000, demoCoverRules),
  "dimensions",
);
const portrait = await sharp({
  create: { width: 900, height: 1400, channels: 3, background: "#336699" },
})
  .png()
  .toBuffer();
const small = await sharp({
  create: { width: 100, height: 80, channels: 3, background: "#336699" },
})
  .png()
  .toBuffer();
const oriented = await sharp({
  create: { width: 800, height: 1200, channels: 3, background: "#336699" },
})
  .withMetadata({ orientation: 6 })
  .jpeg()
  .toBuffer();
const browser = await chromium.launch({ channel: "chrome", headless: true });
const evidence = [];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [834, "fr", "light"],
    [390, "en", "light"],
    [320, "fr", "dark"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await context.addInitScript(() => {
      globalThis.__coverUrls = { created: [], revoked: [] };
      const create = URL.createObjectURL.bind(URL),
        revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        const url = create(blob);
        globalThis.__coverUrls.created.push(url);
        return url;
      };
      URL.revokeObjectURL = (url) => {
        globalThis.__coverUrls.revoked.push(url);
        revoke(url);
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let writes = 0;
    page.on("request", (r) => {
      if (!["GET", "HEAD"].includes(r.method())) writes++;
    });
    await page.goto(`http://127.0.0.1:4317/?lang=${lang}&theme=${theme}`);
    const root = page.locator(".troc-cover-editor");
    await expect(root).toBeVisible();
    const storage = await page.evaluate(() => ({
      local: { ...globalThis.localStorage },
      session: { ...globalThis.sessionStorage },
    }));
    const ranges = root.getByRole("slider"),
      image = root.locator("img").first(),
      initial = await image.getAttribute("src");
    await expect(ranges.nth(1)).toHaveValue("0");
    await expect
      .poll(() => image.evaluate((i) => i.complete && i.naturalWidth > 0))
      .toBe(true);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: `verification/cover-editor-${width}-${lang}-${theme}.jpg`,
      fullPage: true,
    });
    for (let i = 0; i < 3; i++) {
      await ranges.nth(i).focus();
      await page.keyboard.press("End");
      await expect(ranges.nth(i)).toHaveValue(i === 2 ? "3" : "100");
    }
    const frames = await root
      .locator(".troc-cover-editor-frame")
      .evaluateAll((nodes) =>
        nodes.map((n) => {
          const f = n.getBoundingClientRect(),
            i = n.querySelector("img").getBoundingClientRect();
          return {
            covered:
              i.left <= f.left + 0.1 &&
              i.top <= f.top + 0.1 &&
              i.right >= f.right - 0.1 &&
              i.bottom >= f.bottom - 0.1,
          };
        }),
      );
    assert.ok(frames.every((f) => f.covered));
    await root
      .getByRole("button", {
        name: lang === "fr" ? "Centrer et dézoomer" : "Center and reset zoom",
        exact: true,
      })
      .click();
    await expect(ranges.nth(0)).toHaveValue("50");
    await expect(ranges.nth(1)).toHaveValue("50");
    await expect(ranges.nth(2)).toHaveValue("1");

    await root
      .getByRole("button", {
        name: lang === "fr" ? "Annuler" : "Cancel",
        exact: true,
      })
      .click();
    await expect(ranges.nth(0)).toHaveValue("50");
    await expect(ranges.nth(1)).toHaveValue("0");
    await expect(ranges.nth(2)).toHaveValue("1");
    await expect(image).toHaveAttribute("src", initial);
    const input = root.locator("input[type=file]");
    await input.setInputFiles({
      name: "portrait.png",
      mimeType: "image/png",
      buffer: portrait,
    });
    await expect(root.locator(".troc-cover-editor-source")).toContainText(
      "900 × 1400",
    );
    await expect(root).toContainText(
      lang === "fr" ? "Image verticale" : "Portrait image",
    );
    const draftUrl = await image.getAttribute("src");
    await ranges.nth(2).focus();
    await page.keyboard.press("ArrowRight");
    await expect(ranges.nth(2)).toHaveValue("1.05");
    const fail = page.getByRole("checkbox", {
      name: lang === "fr" ? "Simuler un échec" : "Simulate save failure",
    });
    await fail.check();
    const save = root.getByRole("button", {
      name: lang === "fr" ? "Enregistrer le cadrage" : "Save framing",
      exact: true,
    });
    await save.click();
    await expect(root.getByRole("alert")).toContainText(
      lang === "fr" ? "conservé" : "retained",
    );
    await expect(image).toHaveAttribute("src", draftUrl);
    await expect(ranges.nth(2)).toHaveValue("1.05");
    await input.setInputFiles({
      name: "not-image.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    });
    await expect(root.getByRole("alert")).toContainText("JPEG");
    await expect(image).toHaveAttribute("src", draftUrl);
    await input.setInputFiles({
      name: "small.png",
      mimeType: "image/png",
      buffer: small,
    });
    await expect(root.getByRole("alert")).toContainText("800");
    await expect(image).toHaveAttribute("src", draftUrl);
    await input.setInputFiles({
      name: "bad.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    });
    await expect(root.getByRole("alert")).toContainText(
      lang === "fr" ? "Impossible de lire" : "could not be read",
    );
    await fail.uncheck();
    await save.click();
    await expect(page.locator("[data-last-save]")).not.toHaveAttribute(
      "data-last-save",
      "",
    );
    const result = JSON.parse(
      await page.locator("[data-last-save]").getAttribute("data-last-save"),
    );
    assert.deepEqual(Buffer.from(result.originalFile.bytes), portrait);
    assert.equal(result.framing.zoom, 1.05);
    await expect(ranges.nth(2)).toHaveValue("1.05");
    await page
      .getByRole("button", {
        name: lang === "fr" ? "Fermer l’éditeur" : "Close editor",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: lang === "fr" ? "Réouvrir l’éditeur" : "Reopen editor",
        exact: true,
      })
      .click();
    await expect(ranges.nth(2)).toHaveValue("1.05");
    await input.setInputFiles({
      name: "oriented.jpg",
      mimeType: "image/jpeg",
      buffer: oriented,
    });
    await expect(root.locator(".troc-cover-editor-source")).toContainText(
      "1200 × 800",
    );
    const orientedUrl = await image.getAttribute("src");
    await root
      .getByRole("button", {
        name: lang === "fr" ? "Annuler" : "Cancel",
        exact: true,
      })
      .click();
    await expect(ranges.nth(2)).toHaveValue("1.05");
    assert.ok(
      await page.evaluate(
        (url) => globalThis.__coverUrls.revoked.includes(url),
        orientedUrl,
      ),
    );
    // Abandon a new local source: revoke its URL and retain the last saved value.
    await input.setInputFiles({
      name: "abandon.png",
      mimeType: "image/png",
      buffer: portrait,
    });
    await expect(root.locator(".troc-cover-editor-source")).toContainText(
      "abandon.png",
    );
    const abandonedUrl = await image.getAttribute("src");
    const previousSave = await page
      .locator("[data-last-save]")
      .getAttribute("data-last-save");
    await save.click();
    await page
      .getByRole("button", {
        name: lang === "fr" ? "Fermer l’éditeur" : "Close editor",
        exact: true,
      })
      .click();
    await page.waitForTimeout(350);
    await expect(page.locator("[data-last-save]")).toHaveAttribute(
      "data-last-save",
      previousSave,
    );
    assert.ok(
      await page.evaluate(
        (url) => globalThis.__coverUrls.revoked.includes(url),
        abandonedUrl,
      ),
    );
    await page
      .getByRole("button", {
        name: lang === "fr" ? "Réouvrir l’éditeur" : "Reopen editor",
        exact: true,
      })
      .click();
    await expect(ranges.nth(2)).toHaveValue("1.05");
    const axe = await new AxeBuilder({ page })
      .include(".troc-cover-editor")
      .analyze();
    assert.equal(
      axe.violations.length,
      0,
      JSON.stringify(axe.violations.map((v) => v.id)),
    );
    assert.equal(writes, 0);
    assert.deepEqual(
      await page.evaluate(() => ({
        local: { ...globalThis.localStorage },
        session: { ...globalThis.sessionStorage },
      })),
      storage,
    );
    assert.deepEqual(errors, []);
    evidence.push({
      width,
      lang,
      theme,
      keyboard: true,
      cropBounds: true,
      cancel: true,
      errorDraft: true,
      originalBytes: true,
      exifOrientation: true,
      simulatedReedit: true,
      axe: 0,
      writes,
    });
    await context.close();
  }
  await fs.writeFile(
    "verification/cover-editor.json",
    JSON.stringify({ geometryCases, evidence }, null, 2),
  );
  console.log({ geometryCases, evidence });
} finally {
  await browser.close();
}
