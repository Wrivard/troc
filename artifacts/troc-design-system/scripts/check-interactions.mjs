/** Focus, input, local-state, and exact-brief checks using the running guide. */
import assert from "node:assert/strict";
import { connectBrowser } from "./browser-client.mjs";

const base = process.argv[2];
if (!base) throw new Error("Supply the running style-guide URL.");
const b = await connectBrowser();
const { evaluate: ev, wait, page, key, send } = b;
const el = (selector) => `document.querySelector(${JSON.stringify(selector)})`;
const click = (selector) => ev(`(()=>{const e=${el(selector)};if(!e)throw Error(${JSON.stringify(selector)});e.focus();e.click()})()`);
const text = () => ev("document.querySelector('main').innerText.replace(/\\s+/g,' ')");
const check = (condition, message) => { assert.ok(condition, message); console.log(`PASS: ${message}`); };

try {
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 960, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setTouchEmulationEnabled", { enabled: false });
  const url = new URL(base);
  url.searchParams.set("theme", "dark");
  url.searchParams.set("lang", "en");
  await b.navigate(url.toString());
  await wait("document.documentElement.lang==='en-CA' && !!document.querySelector('main h1')");

  await page("selection-controls");
  const checkbox = 'main input[type="checkbox"]:not([disabled]), main button[role="checkbox"]:not([disabled])';
  const checked = (selector) => ev(`(()=>{const e=${el(selector)};return e instanceof HTMLInputElement?e.checked:e.getAttribute('aria-checked')})()`);
  const beforeChecked = await checked(checkbox);
  await click(checkbox);
  check(await checked(checkbox) !== beforeChecked, "Checkbox updates its checked state.");
  const switchSelector = 'main [role="switch"]:not([disabled])';
  const beforeSwitch = await checked(switchSelector);
  await ev(`${el(switchSelector)}.focus()`);
  await key(" ", "Space", 32);
  check(await checked(switchSelector) !== beforeSwitch, "Switch works with the Space key.");

  await page("quantity-control");
  const quantity = "#qty-main";
  const initialQuantity = await ev(`Number(${el(quantity)}.value)`);
  await ev(`${el(quantity)}.closest('.troc-quantity').querySelector('.troc-quantity-step:last-child').click()`);
  check(await ev(`Number(${el(quantity)}.value)`) === initialQuantity + 1, "Quantity increment updates the controlled value.");
  await ev(`${el(quantity)}.focus();${el(quantity)}.select()`);
  await send("Input.insertText", { text: "999" });
  await key("Enter", "Enter", 13);
  check(await ev(`Number(${el(quantity)}.value)===Number(${el(quantity)}.max)`), "Typed quantity clamps to its maximum.");
  check(await ev(`${el("#qty-min")}.closest('.troc-quantity').querySelector('button').disabled && ${el("#qty-max")}.closest('.troc-quantity').querySelector('button:last-child').disabled`), "Boundary quantity steppers are disabled.");

  await page("chips");
  const chip = 'main button.troc-chip[aria-pressed]:not([disabled])';
  const pressed = await ev(`${el(chip)}.getAttribute('aria-pressed')`);
  await click(chip);
  check(await ev(`${el(chip)}.getAttribute('aria-pressed')`) !== pressed, "Filter chip selection updates.");
  const chipCount = await ev("document.querySelectorAll('main .troc-chip-composite').length");
  await click("main .troc-chip-remove:not([disabled])");
  check(await ev("document.querySelectorAll('main .troc-chip-composite').length") === chipCount - 1, "Remove chip is a separate working native button.");
  check(await ev("!document.querySelector('button button, button [role=button]')"), "Chip controls are never nested.");

  await page("tabs");
  await ev("document.querySelector('main [role=tab][aria-selected=true]').focus()");
  const previousTab = await ev("document.activeElement.id");
  await key("ArrowRight", "ArrowRight", 39);
  await wait(`document.activeElement.getAttribute('role')==='tab' && document.activeElement.id!==${JSON.stringify(previousTab)} && document.activeElement.getAttribute('aria-selected')==='true'`);
  check(await ev(`document.activeElement.id!==${JSON.stringify(previousTab)} && document.activeElement.getAttribute('aria-selected')==='true'`), "Tabs support arrow-key selection.");

  await page("tooltip");
  await ev("document.querySelector('main button[data-state]:not([disabled])').focus()");
  await wait("!!document.querySelector('.troc-tooltip')");
  await key("Escape", "Escape", 27);
  await wait("!document.querySelector('.troc-tooltip')");
  console.log("PASS: Keyboard tooltip opens and dismisses.");

  for (const kind of ["popover", "dropdown-menu", "dialog", "drawer"]) {
    await page(kind);
    const trigger = kind === "dropdown-menu" ? 'main button[aria-haspopup="menu"]:not([disabled])' : 'main button[data-state="closed"]:not([disabled])';
    await ev(`(()=>{const t=${el(trigger)};t.setAttribute('data-verification-trigger',${JSON.stringify(kind)});t.focus()})()`);
    await key("Enter", "Enter", 13);
    const overlay = kind === "popover" ? ".troc-popover" : kind === "dropdown-menu" ? '[role="menu"]' : '[role="dialog"]';
    await wait(`!!${el(overlay)}`);
    if (kind === "dialog" || kind === "drawer") {
      await wait(`${el(overlay)}.contains(document.activeElement)`);
      for (let index = 0; index < 9; index++) {
        await key("Tab", "Tab", 9);
        check(await ev(`${el(overlay)}.contains(document.activeElement)`), `${kind}: focus stays in the open modal (${index + 1}).`);
      }
    }
    await key("Escape", "Escape", 27);
    await wait(`!${el(overlay)}`);
    await wait(`document.activeElement.getAttribute('data-verification-trigger')===${JSON.stringify(kind)}`);
    check(await ev(`document.activeElement.getAttribute('data-verification-trigger')===${JSON.stringify(kind)}`), `${kind}: Escape dismisses and returns focus.`);
  }

  await page("toast");
  await click("main button:not([disabled])");
  await wait("!!document.querySelector('.troc-toast')");
  await click(".troc-toast-close");
  await wait("!document.querySelector('.troc-toast')");
  console.log("PASS: Toast trigger and translated close control work.");

  await page("marketplace-progress");
  const progressText = await text();
  for (const exact of ["$1.42 / $5 minimum", "Add $3.58 more from this seller", "Add 3 more cards to unlock 10% off"]) {
    check(progressText.includes(exact), `Exact brief copy: ${exact}`);
  }
  await page("seller-badges");
  const badges = await text();
  for (const label of ["Verified Seller", "Verified Hobby Shop", "Top Seller", "Founding Seller", "Sponsored"]) {
    check(badges.includes(label), `Seller badge meaning: ${label}`);
  }
  await page("smart-cart");
  const comparison = await text();
  for (const exact of ["$22.41", "$19.82", "$42.23", "$24.87", "$7.44", "$32.31", "You save $9.92", "This card costs $0.06 more from this seller but saves $1.24 in shipping."]) {
    check(comparison.includes(exact), `Smart Cart figure/copy: ${exact}`);
  }

  await click('.ds-topbar .ds-language button[lang="fr"]');
  await click(".ds-topbar .ds-theme-control button:first-child");
  await b.reload();
  await wait("!!document.querySelector('main h1')");
  check(await ev("document.documentElement.lang==='fr-CA' && document.documentElement.classList.contains('light')"), "French and light-theme choices persist after reload.");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await page("progress");
  check(await ev("matchMedia('(prefers-reduced-motion: reduce)').matches && document.querySelectorAll('main [data-state=indeterminate]').length>0 && [...document.querySelectorAll('main [data-state=indeterminate]')].every(n=>{const s=getComputedStyle(n);return s.animationName==='none'||(parseFloat(s.animationDuration)<=0.001&&s.animationIterationCount!=='infinite')})"), "Indeterminate progress respects reduced motion.");
  await page("skeleton");
  check(await ev("[...document.querySelectorAll('main .troc-skeleton')].every(n=>[getComputedStyle(n),getComputedStyle(n,'::before'),getComputedStyle(n,'::after')].every(s=>s.animationName==='none'||(parseFloat(s.animationDuration)<=0.001&&s.animationIterationCount!=='infinite')))"), "Skeletons respect reduced motion.");
  assert.deepEqual(b.errors, [], "No uncaught errors during interactions.");
  console.log("PASS: interaction and exact-brief checks complete.");
} finally {
  await send("Emulation.setEmulatedMedia", { features: [] });
  b.close();
}