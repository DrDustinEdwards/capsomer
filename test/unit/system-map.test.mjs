// The system map's pure functions, imported straight from the TypeScript source: the module
// touches no DOM until a controller is made.
import assert from "node:assert/strict";
import { test } from "node:test";
import { connectionText, insideLayout, layoutMap, linksOf, ringCells, spatialNext, systemMapHtml } from "../../components/system-map/system-map.ts";

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
