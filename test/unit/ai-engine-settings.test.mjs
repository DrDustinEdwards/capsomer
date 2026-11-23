import assert from "node:assert/strict";
import { test } from "node:test";
import { settingsFromForm } from "../../components/ai-engine-settings/ai-engine-settings.ts";

const form = (cap) => (name) => (name === "cap" ? cap : "");

test("settingsFromForm: an empty cap is no cap; a malformed or negative one throws instead of removing the cap", () => {
  assert.equal(settingsFromForm(form(""), []).apiCapMicros, 0);
  assert.equal(settingsFromForm(form("2.5"), []).apiCapMicros, 2_500_000);
  for (const bad of ["abc", "-5"]) assert.throws(() => settingsFromForm(form(bad), []), RangeError);
});
