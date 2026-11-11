// The calculator's pure core: how a line's powers are split out, and how a result becomes the view
// tree both renderers draw. Imported straight from the TypeScript source; no DOM is touched.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkTag,
  initialValues,
  resultView,
  textParts,
} from "../../components/calculator/calculator.ts";

test("textParts sets each 10^n as a power, with a real minus", () => {
  assert.deepEqual(textParts("1 x 10^-3 ml, then 10^6"), [
    { text: "1 x 10" },
    { text: "−3", sup: true },
    { text: " ml, then 10" },
    { text: "6", sup: true },
  ]);
  assert.deepEqual(textParts("No powers here"), [{ text: "No powers here" }]);
});

test("resultView announces only sections with a result, and an error alone", () => {
  const view = resultView({
    ok: true,
    sections: [
      { heading: "Total", result: "2 x 10^3 GB", steps: ["Add them."] },
      { heading: "Working", steps: ["One.", "Two."], notes: ["A note."] },
    ],
  });
  assert.equal(view.summary.length, 1);
  assert.deepEqual(view.summary[0], {
    tag: "p",
    className: "cap-calculator-answer",
    children: [
      "Total: ",
      { tag: "strong", children: ["2 x 10", { tag: "sup", children: ["3"] }, " GB"] },
    ],
  });
  assert.equal(view.detail.length, 2);
  assert.equal(view.detail[1].children.length, 3);
  const failed = resultView({ ok: false, error: "Enter a number." });
  assert.deepEqual(failed.detail, []);
  assert.equal(failed.summary[0].className, "cap-calculator-error");
});

test("a view node may not name a tag outside the list", () => {
  assert.equal(checkTag("sup"), "sup");
  assert.throws(() => checkTag("script"), /may not be <script>/);
});

test("initialValues takes the address's value, cut at 40, or the field's own", () => {
  const fields = [
    { name: "a", label: "A", value: "1" },
    { name: "b", label: "B", value: "2" },
  ];
  const params = new URLSearchParams({ a: "9".repeat(60) });
  assert.deepEqual(initialValues(fields, params), { a: "9".repeat(40), b: "2" });
});
