import assert from "node:assert/strict";
import { test } from "node:test";

import { startSite } from "../../components/document/document.ts";

test("startSite: a part that throws or rejects is reported and counted, and the rest still run", async () => {
  const ran = [];
  const errors = [];
  const failed = await startSite(
    [
      () => ran.push("header"),
      () => {
        throw new Error("island");
      },
      () => Promise.reject(new Error("chart")),
      () => ran.push("tabs"),
    ],
    (e) => errors.push(e.message),
  );
  assert.deepEqual(ran, ["header", "tabs"]);
  assert.deepEqual(errors, ["island", "chart"]);
  assert.equal(failed, 2);
});
