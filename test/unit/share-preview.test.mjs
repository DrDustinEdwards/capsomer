import assert from "node:assert/strict";
import { test } from "node:test";
import { serpReading } from "../../components/share-preview/share-preview.ts";

test("serpReading: the cut is said in words only past the limit", () => {
  assert.deepEqual(serpReading("Field notes", 120, 600), {
    over: false,
    display: "120 of 600 px · 11 characters",
    valueText: "120 of 600 pixels, 11 characters.",
  });
  const over = serpReading("A", 601, 600);
  assert.equal(over.over, true);
  assert.equal(
    over.valueText,
    "601 of 600 pixels, 1 character. Google cuts it off past about 600 pixels.",
  );
  assert.equal(serpReading("x", null, 600).over, false);
});
