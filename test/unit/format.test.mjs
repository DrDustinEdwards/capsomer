// The number words every site shares. Only the cases that went wrong in a site's own copy: the kB
// that rounds up into the next unit, an empty median, a rate of nothing.
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBytes, shortCount, median, percentOf } from "../../components/format/format.ts";

test("formatBytes climbs units and never shows 1024 kB", () => {
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(421888), "412 kB");
  assert.equal(formatBytes(1048575), "1 MB");
  assert.equal(formatBytes(2516582), "2.4 MB");
  assert.equal(formatBytes(2 * 1024 ** 2), "2 MB");
  assert.equal(formatBytes(10 * 1024 ** 3), "10 GB");
});

test("median is null for nothing and the mean of the middle pair for an even count", () => {
  assert.equal(median([]), null);
  assert.equal(median([4, 1, 3]), 3);
  assert.equal(median([1, 2, 3, 6]), 2.5);
  assert.equal(median([1, 2], { round: true }), 2);
});

test("percent of nothing is no data, not 0%", () => {
  assert.equal(percentOf(3, 0), null);
  assert.equal(percentOf(1, 3), 33);
  assert.equal(percentOf(1, 3, { digits: 1 }), 33.3);
  assert.equal(shortCount(9999), "9,999");
  assert.equal(shortCount(12_345), "12.3K");
});
