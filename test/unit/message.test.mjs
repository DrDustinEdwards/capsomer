// The result line's reading of a form action's answer, imported from the TypeScript source.
import assert from "node:assert/strict";
import { test } from "node:test";
import { actionResultView } from "../../components/message/message.ts";

test("actionResultView: an error wins, a sentence of success shows, anything else is no result", () => {
  assert.deepEqual(actionResultView({ error: "Choose a room.", ok: "Saved." }), {
    message: "Choose a room.",
    error: "Choose a room.",
    ok: null,
    tone: "crit",
  });
  assert.equal(actionResultView({ ok: "Saved." }).tone, "ok");
  assert.equal(actionResultView({ ok: "Saved." }).message, "Saved.");
  // A move that has nothing to say, a blank sentence, no answer yet and a redirect's null.
  for (const none of [{ ok: true }, { ok: "  " }, { error: "" }, {}, undefined, null, "Saved."])
    assert.equal(actionResultView(none).message, "");
});
