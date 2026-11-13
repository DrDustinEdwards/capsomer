// The build-time graph: a label can never become markup, and a wire to a box not drawn is left out
// rather than drawn to nowhere.
import assert from "node:assert/strict";
import { test } from "node:test";
import { graphSvg } from "../../components/graph/graph.ts";

test("graphSvg escapes labels and drops wires to boxes it does not draw", () => {
  const svg = graphSvg({
    id: "deps",
    title: "Imports",
    boxes: [
      { id: "a", label: "<a>", href: "/a", lines: [{ tone: "crit", text: "CRAP 31" }] },
      { id: "b", label: "b", href: "/b", ring: true },
    ],
    wires: [
      { from: "a", to: "b" },
      { from: "a", to: "missing" },
      { from: "b", to: "b" },
    ],
  });
  assert.ok(svg.includes("&lt;a&gt;"));
  assert.equal((svg.match(/class="cap-graph-wire"/g) ?? []).length, 1);
  assert.match(svg, /data-tone="crit"/);
  assert.match(svg, />cycle</);
});
