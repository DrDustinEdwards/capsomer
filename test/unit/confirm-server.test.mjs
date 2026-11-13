import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmTyped, countMatches } from "../../components/confirm-dialog/confirm-server.ts";

test("a typed count matches only its exact digits, and never a count of zero", () => {
  assert.equal(countMatches(" 3 ", 3), true);
  for (const typed of ["03", "+3", "3.0", "", undefined])
    assert.equal(countMatches(typed, 3), false);
  assert.equal(countMatches("", 0), false);
  assert.equal(countMatches("0", 0), false);
});

test("the posted word is checked again on the server, case and spaces aside", () => {
  const form = new URLSearchParams({ confirm: " Delete ", reason: "" });
  assert.deepEqual(confirmTyped(form, { word: "delete" }), { ok: true, reason: "" });
  assert.equal(confirmTyped(form, { word: "delete", reasonRequired: true }).ok, false);
  assert.equal(
    confirmTyped(new URLSearchParams({ confirm: "delet" }), { word: "delete" }).ok,
    false,
  );
});
