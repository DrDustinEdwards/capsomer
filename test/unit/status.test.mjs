// The status as a string: what the explorer and server-rendered tables use. The cases that matter:
// a reason can never become markup, and each run conclusion lands on the tone the sites disagreed on.
import assert from "node:assert/strict";
import { test } from "node:test";
import { outcomeStatus, statusHtml } from "../../components/status/status.ts";

test("the reason and the label are escaped", () => {
  const html = statusHtml("nodata", "No data", { reason: '<img src=x onerror="1">', brief: true });
  assert.ok(!html.includes("<img"));
  assert.match(html, /title="&lt;img src=x onerror=&quot;1&quot;&gt;"/);
  assert.match(
    statusHtml("ok", "Up"),
    /^<span class="cap-status" data-tone="ok"><svg[^>]*>.*<\/svg>Up<\/span>$/,
  );
});

test("each conclusion has one tone", () => {
  assert.deepEqual(outcomeStatus("success"), { tone: "ok", running: false, label: "Passed" });
  assert.equal(outcomeStatus("neutral").tone, "ok");
  assert.equal(outcomeStatus("skipped").tone, "nodata");
  assert.equal(outcomeStatus("cancelled").tone, "warn");
  assert.equal(outcomeStatus("timed_out").tone, "warn");
  assert.deepEqual(outcomeStatus("startup_failure"), {
    tone: "crit",
    running: false,
    label: "Startup failure",
  });
  assert.deepEqual(outcomeStatus(null), { tone: "info", running: true, label: "Running" });
  assert.equal(outcomeStatus("success", { success: "Built" }).label, "Built");
});
