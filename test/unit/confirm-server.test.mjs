import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmTyped } from "../../components/confirm-dialog/confirm-server.ts";

test("the posted word is checked again on the server, case and spaces aside", () => {
  const form = new URLSearchParams({ confirm: " Delete ", reason: "" });
  assert.deepEqual(confirmTyped(form, { word: "delete" }), { ok: true, reason: "" });
  assert.equal(confirmTyped(form, { word: "delete", reasonRequired: true }).ok, false);
  assert.equal(
    confirmTyped(new URLSearchParams({ confirm: "delet" }), { word: "delete" }).ok,
    false,
  );
});
