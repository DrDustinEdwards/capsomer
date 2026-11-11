// onlyParamsChanged decides whether a route's loader runs: a wrong true hides a write or a filter's
// change, a wrong false only costs a request. Correctness only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { onlyParamsChanged } from "../../components/router/router.ts";

const u = (s) => new URL(s, "https://example.com");
const DISPLAY = ["view", "size"];

test("onlyParamsChanged: a display parameter alone changing skips the loader", () => {
  assert.equal(onlyParamsChanged(u("/media?view=grid"), u("/media?view=list"), DISPLAY), true);
  assert.equal(
    onlyParamsChanged(u("/media?q=cat&size=s"), u("/media?size=l&q=cat"), DISPLAY),
    true,
  );
});

test("onlyParamsChanged: the same address, another path or another parameter runs it", () => {
  // A revalidation after an action has the same address on both sides.
  assert.equal(onlyParamsChanged(u("/media?view=grid"), u("/media?view=grid"), DISPLAY), false);
  assert.equal(onlyParamsChanged(u("/media?view=grid"), u("/other?view=list"), DISPLAY), false);
  assert.equal(
    onlyParamsChanged(u("/media?view=grid&q=a"), u("/media?view=list&q=b"), DISPLAY),
    false,
  );
  assert.equal(onlyParamsChanged(u("/media?tag=a"), u("/media?tag=a&tag=b"), DISPLAY), false);
});

test("onlyParamsChanged: a missing display parameter reads as its default", () => {
  const defaults = { view: "grid" };
  assert.equal(onlyParamsChanged(u("/media"), u("/media?view=grid"), DISPLAY, defaults), false);
  assert.equal(onlyParamsChanged(u("/media"), u("/media?view=list"), DISPLAY, defaults), true);
});
