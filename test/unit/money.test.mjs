// Money in each currency's own places. The cases are the bugs the sites' copies had: JPY divided by
// 100, KWD shown with two places, a bad code that threw in a page, a typed amount for a yen account.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatAmounts,
  formatMoney,
  formatMoneyShort,
  parseMoneyInput,
  plainMajorAmount,
  signedMoney,
} from "../../components/money/money.ts";

test("each currency keeps its own places", () => {
  assert.equal(formatMoney(123456, "usd"), "$1,234.56");
  assert.equal(formatMoney(5000, "jpy"), "¥5,000");
  assert.equal(formatMoney(12345, "kwd"), "KWD\u00a012.345");
  assert.equal(formatMoney(500, "ugx"), "UGX\u00a05");
  assert.equal(plainMajorAmount(12345, "kwd"), "12.345");
});

test("a malformed code is shown, not thrown", () => {
  assert.equal(formatMoney(5000, "us"), "50.00 US");
});

test("short, signed and several currencies", () => {
  assert.equal(formatMoneyShort(1060, "usd"), "$11");
  assert.equal(signedMoney(-4500, "usd"), "-$45");
  assert.equal(signedMoney(0, "usd"), "+$0");
  assert.equal(formatAmounts([]), "$0.00");
  assert.equal(
    formatAmounts([
      { currency: "usd", cents: 120000 },
      { currency: "eur", cents: 8000 },
    ]),
    "$1,200.00 · €80.00",
  );
});

test("a typed amount becomes minor units in its currency", () => {
  assert.equal(parseMoneyInput("1,234.5", "usd"), 123450);
  assert.equal(parseMoneyInput("5000", "jpy"), 5000);
  assert.equal(parseMoneyInput("-3", "usd"), null);
  assert.equal(parseMoneyInput("", "usd"), null);
  assert.equal(parseMoneyInput("12abc", "usd"), null);
});
