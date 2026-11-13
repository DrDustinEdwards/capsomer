import assert from "node:assert/strict";
import { test } from "node:test";

import { startSite } from "../../components/document/document.ts";

test("startSite: a part that throws is reported and the rest still run", () => {
  const ran = [];
  const errors = [];
  const failed = startSite(
    [
      () => ran.push("header"),
      () => {
        throw new Error("island");
      },
      () => ran.push("tabs"),
    ],
    (e) => errors.push(e.message),
  );
  assert.deepEqual(ran, ["header", "tabs"]);
  assert.deepEqual(errors, ["island"]);
  assert.equal(failed, 1);
});
