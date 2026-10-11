// The system map's pure functions, imported straight from the TypeScript source: the module
// touches no DOM until a controller is made.
import assert from "node:assert/strict";
import { test } from "node:test";
import { boxEdge, connectionText, insideLayout, layoutMap, linksOf, outsideLayout, playableFlows, R, ringCells, seamRoute, spatialNext, stepText, systemMapHtml } from "../../components/system-map/system-map.ts";

const family = [
  { id: "core", name: "Core", ring: "core" },
  ...["a", "b", "c", "d", "e", "f"].map((id) => ({ id, name: id.toUpperCase(), ring: "shared" })),
  ...Array.from({ length: 9 }, (_, i) => ({ id: `u${i}`, name: `Used ${i}`, ring: "used", private: i > 6 })),
];

test("ring k holds 6k cells, each a step from the next", () => {
  assert.deepEqual([0, 1, 2, 3].map((k) => ringCells(k).length), [1, 6, 12, 18]);
  for (const k of [1, 2, 3]) {
    const cells = ringCells(k);
    // Axial distance from the middle is k for every cell of ring k.
    for (const [q, r] of cells) assert.equal(Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)), k);
    assert.equal(new Set(cells.map((c) => c.join())).size, cells.length);
  }
});

test("the core takes the middle, shared parts ring it, what people use starts on the next ring", () => {
  const layout = layoutMap(family);
  const ringOf = (id) => layout.cells.find((c) => c.id === id)?.ring;
  assert.equal(ringOf("core"), 0);
  assert.deepEqual(["a", "b", "c", "d", "e", "f"].map(ringOf), [1, 1, 1, 1, 1, 1]);
  assert.ok(family.filter((s) => s.ring === "used").every((s) => ringOf(s.id) === 2));
  assert.equal(layout.rings, 2);
  // Every cell of every drawn ring is drawn; the unused ones are empty shell.
  assert.equal(layout.cells.length, 1 + 6 + 12);
  assert.equal(layout.cells.filter((c) => c.id === null).length, 3);
});

test("shared parts beyond six spill outward, and what people use moves out a ring", () => {
  const many = [{ id: "core", name: "Core", ring: "core" }, ...Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, name: `S${i}`, ring: "shared" })), { id: "u", name: "U", ring: "used" }];
  const layout = layoutMap(many);
  assert.equal(layout.cells.find((c) => c.id === "s7")?.ring, 2);
  assert.equal(layout.cells.find((c) => c.id === "u")?.ring, 3);
  assert.equal(layout.rings, 3);
});

test("arrow keys reach every capsomer from the core, and each goes the way it points", () => {
  const layout = layoutMap(family);
  const tiles = layout.cells.filter((c) => c.id).map((c) => ({ id: c.id, x: c.x, y: c.y }));
  const seen = new Set(["core"]);
  const queue = ["core"];
  while (queue.length) {
    const id = queue.shift();
    for (const dir of ["up", "down", "left", "right"]) {
      const next = spatialNext(tiles, id, dir);
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  assert.equal(seen.size, tiles.length, `reached ${seen.size} of ${tiles.length}`);
  const at = (id) => tiles.find((t) => t.id === id);
  for (const t of tiles) {
    const up = spatialNext(tiles, t.id, "up");
    if (up) assert.ok(at(up).y < t.y);
    const right = spatialNext(tiles, t.id, "right");
    if (right) assert.ok(at(right).x > t.x);
  }
  // Straight up from the core is the cell directly above it.
  const above = spatialNext(tiles, "core", "up");
  assert.equal(at(above).x, 0);
  assert.equal(spatialNext(tiles, "nowhere", "up"), null);
});

test("a chosen capsomer's lines are those touching it with both ends on the map", () => {
  const links = [
    { from: "core", to: "a", kind: "installs" },
    { from: "u1", to: "core", kind: "coordinates" },
    { from: "core", to: "off-map", kind: "reads" },
    { from: "a", to: "b", kind: "installs" },
  ];
  const onMap = new Set(family.map((s) => s.id));
  assert.deepEqual(linksOf(links, "core", onMap).map((l) => l.to), ["a", "core"]);
  assert.equal(connectionText(0), "No connections drawn");
  assert.equal(connectionText(1), "1 connection drawn");
  assert.equal(connectionText(4), "4 connections drawn");
});

test("a line between any two capsomers runs in the seams, from a corner of one to a corner of the other, and crosses no label", () => {
  const { cells } = layoutMap(family);
  const tiles = cells.filter((c) => c.id);
  // The boxes the labels sit in around each centre: the name (at most 64 wide) above the
  // word (at most 48). The browser spec measures the drawn ones.
  const inLabel = ([x, y]) =>
    cells.some((c) => {
      const dx = Math.abs(x - c.x);
      const dy = y - c.y;
      return (dx < 32 && dy > -11 && dy < 9) || (dx < 24 && dy >= 9 && dy < 19);
    });
  const isCorner = (c, [x, y]) => Math.abs(Math.hypot(x - c.x, y - c.y) - R) < 0.1;
  for (const a of tiles) {
    for (const b of tiles) {
      if (a === b) continue;
      const walk = seamRoute(cells, a, b);
      assert.ok(walk.length >= 2, `${a.id} to ${b.id}: no walk`);
      assert.ok(isCorner(a, walk[0]) && isCorner(b, walk.at(-1)), `${a.id} to ${b.id}: does not join them`);
      for (let i = 1; i < walk.length; i++) {
        const [p, q] = [walk[i - 1], walk[i]];
        assert.ok(Math.abs(Math.hypot(q[0] - p[0], q[1] - p[1]) - R) < 0.1, `${a.id} to ${b.id}: a step that is not a side`);
        for (let t = 0; t <= 1; t += 0.05) {
          const pt = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
          assert.ok(!inLabel(pt), `${a.id} to ${b.id} crosses a label at ${pt.map((n) => n.toFixed(1))}`);
        }
      }
    }
  }
  // Neighbours' line is the side they share.
  const core = cells[0];
  const near = cells.find((c) => c.ring === 1);
  assert.equal(seamRoute(cells, core, near).length, 2);
});

test("the lines are drawn before, so beneath, every capsomer", () => {
  const html = systemMapHtml({ systems: family, relationships: [{ from: "core", to: "u1", kind: "coordinates" }] }, { id: "m" });
  const edges = html.indexOf('data-layer="edges"');
  for (const layer of ["core", "inner", "rim"]) assert.ok(edges < html.indexOf(`data-layer="${layer}"`), `the lines are over the ${layer}`);
});

test("the core's parts sit two to a row above, stores three to a row below", () => {
  const boxes = insideLayout([
    { id: "w", system: "core", name: "Worker", kind: "worker" },
    { id: "p", system: "core", name: "Portal", kind: "site" },
    { id: "t", system: "core", name: "Tick", kind: "cron" },
    { id: "d", system: "core", name: "DB", kind: "database" },
    { id: "k", system: "core", name: "KV", kind: "kv" },
  ]);
  const y = (id) => boxes.find((b) => b.c.id === id).y;
  assert.ok(y("w") === y("p") && y("t") > y("w"));
  assert.ok(y("d") > y("t") && y("d") === y("k"));
  assert.equal(boxes.find((b) => b.c.id === "t").x, 0, "a row of one is centred");
});

test("the HTML holds every system once in the drawing and once in the list, escaped", () => {
  const html = systemMapHtml(
    {
      systems: [...family, { id: "x", name: `<img src=x onerror="alert(1)">`, ring: "used", description: `"quoted" & <b>bold</b>` }],
      relationships: [{ from: "core", to: "a", kind: "installs" }, { from: "core", to: "u1", kind: "coordinates" }],
    },
    { id: "m", label: "Family" }
  );
  assert.ok(!html.includes("<img"), "a name reached the page as markup");
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.ok(!html.includes("<b>bold</b>"));
  const tiles = [...html.matchAll(/class="cap-system-map-tile" data-id="([^"]+)"/g)].map((m) => m[1]);
  const items = [...html.matchAll(/<li data-id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(tiles.length, family.length + 1);
  assert.deepEqual([...tiles].sort(), [...items].sort(), "the drawing and the list disagree");
  assert.equal((html.match(/data-private/g) ?? []).length, 2);
  assert.match(html, /data-from="core" data-to="u1" data-kind="coordinates" data-loose/);
  assert.match(html, /<details class="cap-system-map-list" data-cap-part="list" open>/);
  assert.match(html, /role="img" aria-label="Family: 17 systems in rings\. The list below holds the same\."/);
});

// Parts outside the core (Dustin, 2026-10-11: external boxes outside the dashed boundary).
const parts = [
  { id: "w", system: "core", name: "Worker", kind: "worker" },
  { id: "db", system: "core", name: "Store", kind: "database" },
  { id: "agents", system: "core", name: "Agents", kind: "external" },
  { id: "host", system: "core", name: "Host", kind: "external" },
];

test("an external part is never inside: it takes a corner of the drawing, outside the boundary", () => {
  assert.deepEqual(insideLayout(parts).map((b) => b.c.id), ["w", "db"]);
  // One ring (the core and six shared parts), two (the family) and three (twelve more used).
  const more = Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, name: `X${i}`, ring: "used" }));
  for (const [rings, systems] of [[1, family.slice(0, 7)], [2, family], [3, [...family, ...more]]]) {
    const layout = layoutMap(systems);
    assert.equal(layout.rings, rings);
    const boxes = outsideLayout(parts, layout);
    assert.deepEqual(boxes.map((b) => b.c.id), ["agents", "host"]);
    const [vx, vy, vw, vh] = layout.viewBox;
    const boundary = 1.5 * R * Math.max(1, layout.rings) + R * 0.4;
    for (const b of boxes) {
      // The box's nearest point to the middle is outside the boundary, and the box is inside the drawing.
      const nx = Math.max(0, Math.abs(b.x) - b.w / 2);
      const ny = Math.max(0, Math.abs(b.y) - 16);
      assert.ok(Math.hypot(nx, ny) > boundary, `${b.c.id} reaches inside the boundary at ${layout.rings} rings`);
      assert.ok(b.x - b.w / 2 >= vx && b.x + b.w / 2 <= vx + vw && b.y - 16 >= vy && b.y + 16 <= vy + vh, `${b.c.id} leaves the drawing`);
    }
    assert.ok(boxes[0].x < 0 && boxes[0].y < 0 && boxes[1].x > 0 && boxes[1].y < 0, "top left, then top right");
  }
});

test("a flow plays only when every step rides a line between the core's parts, toward an end, lighting the core's parts", () => {
  const data = {
    systems: [{ id: "core", name: "Core", ring: "core" }, { id: "a", name: "A", ring: "used" }],
    containers: parts,
    relationships: [
      { from: "w", to: "agents", kind: "serves" },
      { from: "w", to: "db", kind: "writes" },
      { from: "core", to: "a", kind: "installs" },
    ],
    flows: [
      { id: "good", name: "Good", steps: [{ from: "w", to: "agents", toward: "w", text: "In.", lights: ["db"] }, { from: "w", to: "db", toward: "db", text: "Down." }] },
      { id: "no-line", name: "No line", steps: [{ from: "agents", to: "db", toward: "db", text: "x" }] },
      { id: "wrong-end", name: "Wrong end", steps: [{ from: "w", to: "db", toward: "agents", text: "x" }] },
      { id: "outside-core", name: "Outside", steps: [{ from: "core", to: "a", toward: "a", text: "x" }] },
      { id: "bad-light", name: "Bad light", steps: [{ from: "w", to: "db", toward: "db", text: "x", lights: ["a"] }] },
    ],
  };
  assert.deepEqual(playableFlows(data, data.systems[0]).map((f) => f.id), ["good"]);
  const html = systemMapHtml(data, { id: "m" });
  assert.match(html, /<details class="cap-system-map-flows" data-cap-part="flows" open><summary>Inside Core, step by step<\/summary><section class="cap-system-map-flow" data-flow="good">/);
  assert.match(html, /<li data-from="w" data-to="agents" data-toward="w" data-lights="db">In\.<\/li><li data-from="w" data-to="db" data-toward="db">Down\.<\/li>/);
  assert.match(html, /<g class="cap-system-map-box" data-id="agents" data-x="[^"]+" data-y="[^"]+" data-external>/);
  assert.match(html, /<line class="cap-system-map-wire" data-from="w" data-to="agents"/);
  assert.match(html, /class="cap-system-map-token"/);
  assert.doesNotMatch(html, /no-line|wrong-end|outside-core|bad-light/);
  // No playable flow: no list, no token, and the keys line says nothing of flows.
  const none = systemMapHtml({ ...data, flows: [] }, { id: "m" });
  assert.doesNotMatch(none, /cap-system-map-flows|cap-system-map-token|number keys/);
  assert.match(html, /the number keys move between its steps/);
});

test("the token stops at a box's edge, never on its name, and a step says where it is", () => {
  assert.deepEqual(boxEdge([0, 0], [52, 16], [200, 0], 4), [56, 0]);
  assert.deepEqual(boxEdge([0, 0], [52, 16], [0, -100], 4), [0, -20]);
  // Toward a corner, whichever edge the line meets first.
  const [x, y] = boxEdge([0, 0], [52, 16], [100, 100], 0);
  assert.deepEqual([x, y], [16, 16]);
  assert.deepEqual(boxEdge([5, 5], [52, 16], [5, 5]), [5, 5]);
  assert.equal(stepText(3, 9, "Worked: the agent works."), "Step 3 of 9. Worked: the agent works.");
});

test("only four parts fit outside, a core-only map has no outside, and a flow needing an undrawn part is not offered", () => {
  const five = Array.from({ length: 5 }, (_, i) => ({ id: `e${i}`, system: "core", name: `E${i}`, kind: "external" }));
  const layout = layoutMap(family);
  assert.deepEqual(outsideLayout(five, layout).map((b) => b.c.id), ["e0", "e1", "e2", "e3"]);
  assert.deepEqual(outsideLayout(five, layoutMap([{ id: "core", name: "Core", ring: "core" }])), []);
  const data = {
    systems: family,
    containers: [{ id: "w", system: "core", name: "W", kind: "worker" }, ...five],
    relationships: [{ from: "w", to: "e0", kind: "serves" }, { from: "w", to: "e4", kind: "serves" }],
    flows: [
      { id: "drawn", name: "Drawn", steps: [{ from: "w", to: "e0", toward: "e0", text: "x" }] },
      { id: "undrawn", name: "Undrawn", steps: [{ from: "w", to: "e4", toward: "e4", text: "x" }] },
    ],
  };
  assert.deepEqual(playableFlows(data, family[0]).map((f) => f.id), ["drawn"]);
});
