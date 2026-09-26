import test from "node:test";
import assert from "node:assert/strict";
import {
  suggestionRequests,
  validateSuggestions,
  presentationGroups,
  searchHref,
} from "../artifacts/marketplace/src/modules/global-search/suggestions-client";
test("one transport coalesces typing and suppresses stale success, failure and cancellation", async () => {
 const pending: {resolve:(response:Response)=>void;reject:(error:Error)=>void}[]=[];
 const fetcher: typeof fetch=()=>new Promise((resolve,reject)=>pending.push({resolve,reject}));
 const requests=suggestionRequests(fetcher);
 const old=requests.load("one","en"), skipped=requests.load("two","en"), latest=requests.load("three","fr");
 assert.equal(pending.length,1,"only one server request while typing");
 pending[0].resolve(Response.json({query:"one",locale:"en",groups:[]}));
 assert.equal(await old,null);assert.equal(await skipped,null);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(pending.length,2);
 pending[1].resolve(Response.json({query:"three",locale:"fr",groups:[]}));
 assert.deepEqual(await latest,{data:{query:"three",locale:"fr",groups:[]},error:false});
 const failed=requests.load("old","en"), next=requests.load("new","en");
 pending[2].reject(new Error("late failure"));assert.equal(await failed,null);
 await new Promise(resolve=>setImmediate(resolve));requests.cancel();
 pending[3].resolve(Response.json({query:"new",locale:"en",groups:[]}));assert.equal(await next,null);
 const malformed=requests.load("current","en");pending[4].resolve(Response.json({query:"wrong",locale:"en",groups:[]}));assert.deepEqual(await malformed,{error:true});
});
test("typed mapper preserves zero/null, demo, exact variant and encoded query; rejects malformed destinations", () => {
  const value: import("@workspace/catalog").CatalogSuggestions = {query:"bulbasaur",locale:"fr",groups:[{kind:"cards",results:[{id:"00000000-0000-4000-8000-000000000001",variantId:"00000000-0000-4000-8000-000000000002",slug:"bulbasaur",name:{en:"Bulbasaur",fr:"Bulbizarre"},demo:true,lowestCents:null}]}]};
  validateSuggestions(value, "bulbasaur", "fr");
  const row = value.groups.find((group) => group.kind === "cards")!.results[0];
  row.lowestCents = 0;
  const result = presentationGroups(value, "/base").find(
    (group) => group.kind === "cards",
  )!.results[0];
  assert.equal(result.lowestCents, 0);
  assert.ok(result.href.includes("variantId=" + row.variantId));
  assert.match(result.detail!, /Démonstration/);
  assert.equal(result.href.startsWith("/base/product/"), true);
  const href = new URL(
    searchHref("", "fr", "#OP01-001 123/167"),
    "https://local.invalid",
  );
  assert.equal(href.searchParams.get("q"), "#OP01-001 123/167");
  for (const mutate of [
    (v: typeof value) => {
      v.groups[0].results[0].slug = "//evil.test";
    },
    (v: typeof value) => {
      v.groups[0].results[0].lowestCents = -1;
    },
    (v: typeof value) => {
      v.groups[0].results.push(v.groups[0].results[0]);
    },
    (v: typeof value) => {
      v.groups[0].results[0].imageUrl = "javascript:alert(1)";
    },
  ]) {
    const bad = structuredClone(value);
    mutate(bad);
    assert.throws(() => validateSuggestions(bad, "bulbasaur", "fr"));
  }
});
