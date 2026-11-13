// The data layer's plain parts: what a response comes to, and the reconnect wait.
import assert from "node:assert/strict";
import { test } from "node:test";
import { answerOf, reconnectDelay } from "../../components/data/data.ts";

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("answerOf: sign-out, expiry, refusal in the server's words, and a success that is not JSON", async () => {
  assert.deepEqual(await answerOf(new Response("", { status: 401 })), { kind: "signed-out" });
  assert.deepEqual(await answerOf(new Response("no", { status: 403 })), { kind: "signed-out" });
  assert.deepEqual(await answerOf(new Response("CSRF refused", { status: 403 }), false), {
    kind: "refused",
    status: 403,
    message: "CSRF refused",
  });
  assert.deepEqual(await answerOf(new Response("The preview expired.", { status: 410 })), {
    kind: "expired",
    message: "The preview expired.",
  });
  assert.equal((await answerOf(new Response("<html>", { status: 200 }))).kind, "error");
  assert.deepEqual(await answerOf(json(200, { ok: 1 })), { kind: "ok", value: { ok: 1 } });
});

test("reconnectDelay: doubles from the base, capped, jittered below the ceiling", () => {
  const top = { random: () => 1 };
  assert.equal(reconnectDelay(0, top), 1000);
  assert.equal(reconnectDelay(3, top), 8000);
  assert.equal(reconnectDelay(20, top), 30_000);
  assert.equal(reconnectDelay(4, { random: () => 0.5 }), 8000);
});
