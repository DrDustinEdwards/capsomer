import { strict as assert } from "node:assert";
import { test } from "node:test";
import { frameHtml, numericColumns, tableHtml } from "../../components/chart-frame/chart-frame.ts";

const table = { columns: ["Day", "Minutes", "Note"], rows: [["Thu <b>24</b>", "260", "ok & fine"], ["Fri 25", "1,280", "5%"]] };

test("tableHtml escapes every cell and header, and keeps the first column as row headers", () => {
  const html = tableHtml({ columns: ['<img src=x onerror=alert(1)>', "N"], rows: [["<script>x</script>", "1"]] }, 'a "label"');
  assert.ok(!html.includes("<img"), html);
  assert.ok(!html.includes("<script>"), html);
  assert.ok(html.includes("&lt;script&gt;x&lt;/script&gt;"));
  assert.ok(html.includes('aria-label="a &quot;label&quot;"'));
  assert.match(html, /<th scope="row">/);
  assert.match(html, /<th scope="col">/);
  assert.ok(html.includes('tabindex="0"') && html.includes('role="region"'));
});

test("numericColumns marks only columns where every cell is a figure", () => {
  assert.deepEqual(numericColumns(table), [false, true, false]);
  assert.deepEqual(numericColumns({ columns: ["A"], rows: [] }), [false]);
});

test("frameHtml puts the summary and the table in the HTML, closed unless opened, and escapes the text", () => {
  const closed = frameHtml({ id: "x", title: "Req <1>", summary: "Up & down.", chart: "<svg></svg>", table });
  assert.ok(closed.includes('<p class="cap-chart-summary" id="x-summary">Up &amp; down.</p>'));
  assert.ok(closed.includes("Req &lt;1&gt;"));
  assert.ok(closed.includes("<svg></svg>"), "the chart is trusted markup, placed as it comes");
  assert.ok(closed.includes("1,280"), "the numbers are in the HTML while closed");
  assert.ok(!/<details[^>]* open/.test(closed));
  assert.ok(/<details[^>]* open/.test(frameHtml({ id: "x", title: "t", summary: "s", chart: "", table, open: true })));
  assert.ok(frameHtml({ id: "x", title: "t", summary: "s", chart: "", table, level: 2 }).includes('<h2 class="cap-chart-title"'));
});
