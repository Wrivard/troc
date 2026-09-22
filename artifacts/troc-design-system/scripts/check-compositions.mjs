/** Local demo behavior only: no marketplace service or transaction is invoked. */
import assert from "node:assert/strict";
import { connectBrowser } from "./browser-client.mjs";
const base = process.argv[2];
if (!base) throw new Error("Supply the running style-guide URL.");
const b = await connectBrowser();
const { evaluate: ev, wait, page, send, key } = b;
const q = (selector) => `document.querySelector(${JSON.stringify(selector)})`;
const click = (selector) => ev(`${q(selector)}.click()`);
const namedButton = (name) => `([...document.querySelectorAll('main button')].find(e=>e.textContent.trim()===${JSON.stringify(name)} && e.getClientRects().length))`;
const press = (name) => ev(`${namedButton(name)}.click()`);
const pass = (condition, message) => { assert.ok(condition, message); console.log(`PASS: ${message}`); };
try {
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 960, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setTouchEmulationEnabled", { enabled: false });
  const url = new URL(base);
  url.searchParams.set("theme", "dark");
  url.searchParams.set("lang", "en");
  await b.navigate(url.toString());
  await wait("!!document.querySelector('main h1') && document.documentElement.lang==='en-CA'");

  await page("global-search");
  await ev(`${q("main .troc-global-search-field")}.focus()`);
  await send("Input.insertText", { text: "Pika" });
  await wait("document.querySelectorAll('main [role=option]').length>0");
  await key("ArrowDown", "ArrowDown", 40);
  await wait(`${q("main .troc-global-search-field")}.getAttribute('aria-activedescendant')`);
  await key("Enter", "Enter", 13);
  await wait(`${q("main .troc-global-search-field")}.getAttribute('aria-expanded')==='false'`);
  pass(await ev("[...document.querySelectorAll('main [role=status]')].some(e=>e.textContent.includes('Selected: Pikachu'))"), "Search filters and selects suggestions with the keyboard.");
  await click("main .troc-global-search-clear");
  await wait(`${q("main .troc-global-search-field")}.value===''`);
  console.log("PASS: Search clears its controlled value.");

  await page("pagination");
  await click('main button[aria-label="Next page"]');
  await wait(`${q('main .troc-pagination-link[aria-current="page"]')}.textContent==='2'`);
  pass(await ev("document.querySelectorAll('main .troc-pagination-ellipsis .sr-only').length>0 && !document.querySelector('main .troc-pagination-ellipsis[aria-hidden=true]')"), "Pagination changes page and exposes skipped-page text.");

  await page("cart-seller-group");
  const cart = "main .troc-cart-group";
  const quantity = `${cart} .troc-quantity-field`;
  const cartBefore = await ev(`${q(cart)}.innerText`);
  const quantityBefore = await ev(`Number(${q(quantity)}.value)`);
  await ev(`${q(cart)}.querySelector('.troc-cart-item .troc-quantity-step:last-child').click()`);
  await wait(`Number(${q(quantity)}.value)===${quantityBefore + 1}`);
  pass(await ev(`${q(cart)}.innerText!==${JSON.stringify(cartBefore)}`), "Cart quantity changes update sample totals and progress.");
  const itemsBefore = await ev(`${q(cart)}.querySelectorAll('.troc-cart-item').length`);
  await click(`${cart} .troc-cart-item-remove button`);
  await wait(`${q(cart)}.querySelectorAll('.troc-cart-item').length===${itemsBefore - 1}`);
  console.log("PASS: Cart removal updates the local seller group.");

  await page("seller-offer");
  await click("main .troc-offer-actions button.troc-button--primary");
  await wait(`${q("main .troc-offer")}.getAttribute('aria-busy')==='true'`);
  pass(await ev(`[...${q("main .troc-offer")}.querySelectorAll('button,input')].every(e=>e.disabled)`), "Pending seller offer prevents duplicate actions and quantity changes.");
  await wait(`${q("main .troc-offer")}.getAttribute('aria-busy')!=='true'`);
  console.log("PASS: Seller offer completes its local demo action.");

  await page("data-controls");
  const results = 'main ul.ds-stack[aria-busy]';
  const fullCount = await ev(`${q(results)}.children.length`);
  pass(await ev("getComputedStyle(document.querySelector('main .ds-mobile-only')).display==='none'"), "Desktop does not duplicate the mobile filter controls.");
  await press("Pokémon");
  await wait(`${q(results)}.children.length<${fullCount}`);
  pass(await ev(`${q(results)}.children.length>0`), "Game filtering changes the local result set.");
  await press("Clear all");
  await wait(`${q(results)}.children.length===${fullCount}`);
  await click("main .ds-desktop-only .troc-sort-control-trigger");
  await wait("!!document.querySelector('[role=option]')");
  await key("Home", "Home", 36);
  await key("ArrowDown", "ArrowDown", 40);
  await wait("document.activeElement.textContent.toLowerCase().includes('price')");
  await key("Enter", "Enter", 13);
  await wait("!document.querySelector('[role=option]')");
  const prices = await ev(`[...${q(results)}.children].map(e=>Number(e.innerText.match(/\\$([\\d,.]+)/)?.[1].replaceAll(',','')))`);
  pass(prices.every(Number.isFinite) && prices.every((price, index) => !index || price >= prices[index - 1]), "Price sorting changes the actual local result order.");

  await page("data-table");
  await click('main input[aria-label="Select all rows"]');
  await wait("[...document.querySelectorAll('main tbody input[type=checkbox]')].every(e=>e.checked)");
  pass(await ev("document.querySelectorAll('main tbody input:checked').length>0"), "Inventory select-all updates visible rows.");
  const priceHead = `${q('main button[aria-label="Sort by Price"]')}.closest('th')`;
  let direction = await ev(`${priceHead}.getAttribute('aria-sort')`);
  for (let step = 0; step < 3; step++) {
    const next = direction === "ascending" ? "descending" : direction === "descending" ? "none" : "ascending";
    await click('main button[aria-label="Sort by Price"]');
    await wait(`${priceHead}.getAttribute('aria-sort')===${JSON.stringify(next)}`);
    if (next !== "none") {
      const amounts = await ev(`[...document.querySelectorAll('main tbody tr')].map(row=>Number(row.cells[${priceHead}.cellIndex].innerText.match(/\\$([\\d,.]+)/)?.[1].replaceAll(',','')))`);
      pass(amounts.every(Number.isFinite) && amounts.every((value, index) => !index || (next === "ascending" ? value >= amounts[index - 1] : value <= amounts[index - 1])), `Inventory price order is ${next}.`);
    }
    direction = next;
  }
  const tableBefore = await ev("document.querySelector('main tbody').innerText");
  await click('main button[aria-label="Next page"]');
  await wait(`document.querySelector('main tbody').innerText!==${JSON.stringify(tableBefore)}`);
  console.log("PASS: Inventory sorting and pagination change the visible sample rows.");
  await press("Loading");
  await wait("!!document.querySelector('main .troc-skeleton')");
  await press("Error");
  await wait("!!document.querySelector('main [role=alert]')");
  await ev("[...document.querySelectorAll('main button')].find(e=>/Retry|Try again/i.test(e.textContent)).click()");
  await wait("document.querySelectorAll('main tbody input[type=checkbox]').length>0");
  console.log("PASS: Inventory loading/error/retry states work locally.");
  await press("Empty");
  await wait("document.querySelectorAll('main tbody input[type=checkbox]').length===0");
  console.log("PASS: Inventory empty state does not pretend to have rows.");

  await page("chart");
  pass(await ev("document.querySelectorAll('main table tbody tr').length>0"), "Charts include a real accessible tabular data alternative.");

  await page("mobile");
  await ev("[...document.querySelectorAll('main .troc-mobile-bottom-item')].find(e=>e.textContent.trim()==='Search').click()");
  await wait("document.activeElement.classList.contains('troc-global-search-field')");
  console.log("PASS: Mobile Search focuses the real search field.");
  await key("Escape", "Escape", 27);

  await page("data-controls");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await press("Filters");
  await wait("!!document.querySelector('[role=dialog]')");
  await wait("document.querySelector('[role=dialog]').contains(document.activeElement)");
  pass(await ev("!document.querySelector('main .ds-desktop-only').getClientRects().length"), "Phone filtering uses its focus-managed drawer, not desktop controls.");
  await key("Escape", "Escape", 27);
  await wait("!document.querySelector('[role=dialog]')");
  assert.deepEqual(b.errors, []);
  console.log("PASS: composition behavior checks complete.");
} finally {
  b.close();
}