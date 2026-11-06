// The publish transitions: the draft flag each intent asks for fails closed, so a wrong or missing
// intent leaves a post private, and an unreadable schedule never hides a live post.
import assert from "node:assert/strict";
import { test } from "node:test";
import { draftForIntent, PUBLISH_CONFIRMED_INTENT, saveInPlaceIntent, stateOf, transitionsFor } from "../../components/publish-gate/publish-transition.ts";

test("draftForIntent: only a publishing intent clears draft; anything else stays a draft", () => {
  for (const intent of ["publish", "republish", "save", PUBLISH_CONFIRMED_INTENT]) assert.equal(draftForIntent(intent), false, intent);
  for (const intent of ["save-draft", "unpublish", "", "publish ", "constructor", null]) assert.equal(draftForIntent(intent), true, String(intent));
});

test("transitionsFor: the ceremony is for a first publication only", () => {
  assert.equal(transitionsFor("draft", false)[0].ceremony, true);
  assert.equal(transitionsFor("draft", true)[0].ceremony, false);
  assert.deepEqual(transitionsFor("scheduled", true).map((t) => t.id), ["save", "unpublish"]);
});

test("saveInPlaceIntent: keeps the current state", () => {
  assert.equal(saveInPlaceIntent("draft"), "save-draft");
  assert.equal(saveInPlaceIntent("published"), "save");
  assert.equal(saveInPlaceIntent("scheduled"), "save");
});

test("stateOf: a future publish_at is scheduled; an unparseable one is published", () => {
  const now = Date.parse("2026-01-01T00:00:00Z");
  assert.equal(stateOf({ draft: true, publishAt: "2027-01-01" }, now), "draft");
  assert.equal(stateOf({ draft: false, publishAt: "" }, now), "published");
  assert.equal(stateOf({ draft: false, publishAt: "2027-01-01T00:00:00Z" }, now), "scheduled");
  assert.equal(stateOf({ draft: false, publishAt: "2025-01-01T00:00:00Z" }, now), "published");
  assert.equal(stateOf({ draft: false, publishAt: "not a date" }, now), "published");
});
