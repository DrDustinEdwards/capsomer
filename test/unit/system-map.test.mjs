// The system map's pure functions, imported straight from the TypeScript source: the module
// touches no DOM until a controller is made.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BEND_CLEAR,
  connectionText,
  insideScene,
  JUNCTION_END,
  LINE_SEP,
  layoutMap,
  linksOf,
  R,
  playableFlows,
  pointSegDist,
  ROUTE_CLEAR,
  rectInset,
  rectOutset,
  ringCells,
  routeFrames,
  SHORT_LINK,
  seamRoute,
  segDist,
  segmentCross,
  segmentHitsBox,
  segmentHitsRect,
  sideBySide,
  spatialNext,
  stepText,
  systemMapHtml,
  tokenRoute,
} from "../../components/system-map/system-map.ts";

const rectOf = (b) => ({ x: b.x - b.w / 2, y: b.y - 16, w: b.w, h: 32 });

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

test("grouped, each group is a chain of neighbours, apart from every other group, and named", () => {
  const groups = { Sites: ["w1", "w2", "w3", "w4", "w5"], Apps: ["a1", "a2", "a3", "a4"], Books: ["b1", "b2", "b3"], Tools: ["t1", "t2", "t3", "t4"] };
  const systems = [
    { id: "core", name: "Core", ring: "core" },
    ...["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => ({ id, name: id, ring: "shared" })),
    ...Object.entries(groups).flatMap(([group, ids]) => ids.map((id) => ({ id, name: id, ring: "used", group }))),
  ];
  const layout = layoutMap(systems);
  const at = new Map(layout.cells.filter((c) => c.id).map((c) => [c.id, c]));
  const touch = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < R * 1.8;
  for (const [group, ids] of Object.entries(groups)) {
    for (let i = 1; i < ids.length; i++) assert.ok(touch(at.get(ids[i - 1]), at.get(ids[i])), `${ids[i]} touches ${ids[i - 1]}`);
    const others = Object.entries(groups).filter(([g]) => g !== group).flatMap(([, o]) => o);
    for (const id of ids) for (const o of others) assert.ok(!touch(at.get(id), at.get(o)), `${id} is apart from ${o}`);
  }
  assert.ok(layout.grouped);
  assert.deepEqual(layout.labels.map((l) => l.text), Object.keys(groups));
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
  const { boxes } = insideScene(
    [
      { id: "w", system: "core", name: "Worker", kind: "worker" },
      { id: "p", system: "core", name: "Portal", kind: "site" },
      { id: "t", system: "core", name: "Tick", kind: "cron" },
      { id: "d", system: "core", name: "DB", kind: "database" },
      { id: "k", system: "core", name: "KV", kind: "kv" },
    ],
    [],
    layoutMap(family),
  );
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

test("an external part is never inside: it sits in a top corner outside the circle, two to a band", () => {
  const scene = insideScene(parts, [], layoutMap(family));
  const ext = scene.boxes.filter((b) => b.c.kind === "external");
  assert.deepEqual(ext.map((b) => b.c.id), ["agents", "host"]);
  const { cy } = scene.boundary;
  assert.ok(ext[0].x < 0 && ext[1].x > 0 && ext.every((b) => b.y < cy && rectOutset(rectOf(b), scene.boundary) >= 16), "top left, then top right, outside the circle");
});


test("a flow plays only when every step rides a line between the core's parts, toward an end, lighting the core's parts", () => {
  const data = {
    systems: [{ id: "core", name: "Core", ring: "core" }, { id: "a", name: "A", ring: "used" }],
    containers: parts,
    relationships: [
      { from: "w", to: "agents", kind: "serves" },
      { from: "w", to: "db", kind: "writes" },
      { from: "core", to: "a", kind: "installs" },
      { from: "w", to: "w", kind: "calls" },
    ],
    flows: [
      { id: "good", name: "Good", steps: [{ from: "w", to: "agents", toward: "w", text: "In.", lights: ["db"] }, { from: "w", to: "db", toward: "db", text: "Down." }] },
      { id: "no-line", name: "No line", steps: [{ from: "agents", to: "db", toward: "db", text: "x" }] },
      { id: "wrong-end", name: "Wrong end", steps: [{ from: "w", to: "db", toward: "agents", text: "x" }] },
      { id: "outside-core", name: "Outside", steps: [{ from: "core", to: "a", toward: "a", text: "x" }] },
      { id: "bad-light", name: "Bad light", steps: [{ from: "w", to: "db", toward: "db", text: "x", lights: ["a"] }] },
      // A line from a part to itself is never drawn, so a step along one has nothing to ride.
      { id: "self", name: "Self", steps: [{ from: "w", to: "w", toward: "w", text: "x" }] },
    ],
  };
  assert.deepEqual(playableFlows(data, data.systems[0]).map((f) => f.id), ["good"]);
  const html = systemMapHtml(data, { id: "m" });
  assert.match(html, /<details class="cap-system-map-flows" data-cap-part="flows" open><summary>Inside Core, step by step<\/summary><section class="cap-system-map-flow" data-flow="good">/);
  assert.match(html, /<li data-from="w" data-to="agents" data-toward="w" data-lights="db">In\.<\/li><li data-from="w" data-to="db" data-toward="db">Down\.<\/li>/);
  assert.match(html, /<g class="cap-system-map-box" data-id="agents" data-x="[^"]+" data-y="[^"]+" data-external>/);
  assert.match(html, /<path class="cap-system-map-wire" data-from="w" data-to="agents" data-route="[-\d.,]+ [-\d.,]+" d="M[^"]+"\/>/);
  assert.match(html, /class="cap-system-map-token"/);
  assert.doesNotMatch(html, /no-line|wrong-end|outside-core|bad-light|"self"/);
  // No playable flow: no list, no token, and the keys line says nothing of flows.
  const none = systemMapHtml({ ...data, flows: [] }, { id: "m" });
  assert.doesNotMatch(none, /cap-system-map-flows|cap-system-map-token|number keys/);
  assert.match(html, /the number keys move between its steps/);
});

test("a step says where it is", () => {
  assert.equal(stepText(3, 9, "Worked: the agent works."), "Step 3 of 9. Worked: the agent works.");
});

test("only four parts fit outside, and a flow needing an undrawn part is not offered", () => {
  const five = Array.from({ length: 5 }, (_, i) => ({ id: `e${i}`, system: "core", name: `E${i}`, kind: "external" }));
  const layout = layoutMap(family);
  const outside = (containers) => insideScene(containers, [], layout).boxes.filter((b) => b.c.kind === "external").map((b) => b.c.id);
  assert.deepEqual(outside(five), ["e0", "e1", "e2", "e3"]);
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

// The rules a drawing inside the core keeps (the seat's rulings on capsomer#64), checked on
// Capsid's own parts and on 100 seeded random cores, each on a one-, two- and three-ring map.

const capsidParts = [
  ["w", "worker", "MCP Worker"], ["p", "site", "Portal"], ["t", "cron", "Tick"], ["db", "database", "capsid D1"],
  ["m", "bucket", "capsid-media"], ["kv", "kv", "app KV"], ["agents", "external", "Agents"], ["gh", "external", "GitHub"],
].map(([id, kind, name]) => ({ id, system: "core", name, kind }));
const capsidLinks = [["w", "db"], ["w", "m"], ["w", "kv"], ["w", "p"], ["t", "db"], ["t", "kv"], ["w", "agents"], ["w", "gh"], ["t", "gh"], ["gh", "w"]].map(([from, to]) => ({ from, to, kind: "uses" }));

test("the circle is as large as the drawing allows: it reaches a margin or a part outside", () => {
  const scene = insideScene(capsidParts, capsidLinks, layoutMap(family), "Inside Capsid");
  const [vx, vy, vw, vh] = scene.viewBox;
  const { cx, cy, r } = scene.boundary;
  const room = Math.min(vw / 2 - 8 - Math.abs(cx - vx - vw / 2), cy - vy - 8, vy + vh - 8 - cy, ...scene.boxes.filter((b) => b.c.kind === "external").map((b) => rectOutset(rectOf(b), { cx, cy, r: 0 }) - 16));
  assert.ok(r > room - 1 && r <= room, `radius ${r}, room ${room}`);
  assert.ok(2 * r > 0.8 * Math.min(vw, vh), "the circle spans most of the drawing");
});
const more = Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, name: `X${i}`, ring: "used" }));
const layouts = [layoutMap(family.slice(0, 7)), layoutMap(family), layoutMap([...family, ...more])];

function randomCores(count) {
  const kinds = ["worker", "site", "cron", "database", "bucket", "kv", "queue", "external"];
  let seed = 20261011;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const out = [];
  for (let run = 0; run < count; run++) {
    const n = 2 + Math.floor(rand() * 9);
    const parts = Array.from({ length: n }, (_, i) => ({ id: `c${i}`, system: "core", name: `C${i}`, kind: kinds[Math.floor(rand() * kinds.length)] }));
    const links = [];
    for (let k = 0; k < n * 2; k++) {
      const a = Math.floor(rand() * n);
      const b = Math.floor(rand() * n);
      if (a !== b) links.push({ from: `c${a}`, to: `c${b}`, kind: "uses" });
    }
    out.push({ parts, links });
  }
  return out;
}

const within = (r, o, g) => r.x - g >= o.x && r.y - g >= o.y && r.x + r.w + g <= o.x + o.w && r.y + r.h + g <= o.y + o.h;
const apart = (r, o, g) => r.x + r.w + g <= o.x || o.x + o.w + g <= r.x || r.y + r.h + g <= o.y || o.y + o.h + g <= r.y;
const segs = (route) => route.slice(1).map((q, i) => [route[i], q]);
const lengthOf = (route) => segs(route).reduce((n, [p, q]) => n + Math.hypot(q[0] - p[0], q[1] - p[1]), 0);
/** Every rule a scene breaks, by name: where its boxes sit, then how its lines run. */
function faults(scene) {
  const out = { place: [], box: [], label: [], junction: [], side: [], bend: [], port: [] };
  const [vx, vy, vw, vh] = scene.viewBox;
  const view = { x: vx, y: vy, w: vw, h: vh };
  for (const b of scene.boxes) {
    const r = rectOf(b);
    if (!within(r, view, 0)) out.place.push(`${b.c.id} leaves the drawing`);
    if ((b.c.kind === "external" ? rectOutset(r, scene.boundary) : rectInset(r, scene.boundary)) < 8) out.place.push(`${b.c.id} is not ${b.c.kind === "external" ? "outside" : "inside"} the boundary with clear space`);
    if (!apart(r, scene.label.box, 4)) out.place.push(`${b.c.id} covers the boundary's name`);
  }
  for (const [i, p] of scene.boxes.entries()) for (const q of scene.boxes.slice(i + 1)) if (!apart(rectOf(p), rectOf(q), 2 * ROUTE_CLEAR)) out.place.push(`${p.c.id} and ${q.c.id} leave a line no room`);
  if (rectInset(scene.label.box, scene.boundary) < 0) out.place.push("the name leaves the boundary");
  const at = new Map(scene.boxes.map((b) => [b.c.id, b]));
  for (const w of scene.wires) {
    const name = `${w.from}-${w.to}`;
    if (at.get(w.from)?.c.kind !== "external" && at.get(w.to)?.c.kind !== "external" && !w.route.every(([x, y]) => Math.hypot(x - scene.boundary.cx, y - scene.boundary.cy) <= scene.boundary.r)) out.place.push(`${name}, between two parts inside, leaves the boundary`);
    for (const [p, q] of segs(w.route)) {
      for (const o of scene.boxes) {
        const end = o.c.id === w.from || o.c.id === w.to;
        if (segmentHitsBox(p, q, o, end ? 0 : ROUTE_CLEAR - 0.01)) out.box.push(`${name} ${end ? "enters" : "runs within ROUTE_CLEAR of"} ${o.c.id}`);
      }
      if (segmentHitsRect(p, q, scene.label.box)) out.label.push(`${name} crosses the boundary's name`);
    }
  }
  for (const a of scene.wires) for (const b of scene.wires) {
    if (a === b) continue;
    const bShort = lengthOf(b.route) < SHORT_LINK;
    const bEnds = [b.route[0], b.route.at(-1)];
    for (const [p, q] of segs(a.route)) for (const [c, d] of segs(b.route)) {
      const x = segmentCross(p, q, c, d);
      if (x && (bShort || bEnds.some((e) => Math.hypot(x[0] - e[0], x[1] - e[1]) < JUNCTION_END))) out.junction.push(`${a.from}-${a.to} crosses ${b.from}-${b.to} ${bShort ? "a short line" : "near its end"}`);
      if (!x && sideBySide(p, q, c, d) && sideBySide(c, d, p, q) && segDist(p, q, c, d) < LINE_SEP) out.side.push(`${a.from}-${a.to} runs beside ${b.from}-${b.to}`);
    }
    for (const bend of a.route.slice(1, -1)) if (segs(b.route).some(([c, d]) => pointSegDist(bend, c, d) < BEND_CLEAR)) out.bend.push(`a bend in ${a.from}-${a.to} sits near ${b.from}-${b.to}`);
  }
  // Lines sharing a box leave it at their own points.
  const ends = new Map();
  for (const w of scene.wires) for (const [id, pt] of [[w.from, w.route[0]], [w.to, w.route.at(-1)]]) {
    if (!at.has(id)) continue;
    const list = ends.get(id) ?? [];
    for (const o of list) if (Math.hypot(o[0] - pt[0], o[1] - pt[1]) < 6) out.port.push(`two lines leave ${id} at one point`);
    list.push(pt);
    ends.set(id, list);
  }
  return Object.fromEntries(Object.entries(out).map(([rule, list]) => [rule, [...new Set(list)]]));
}

test("Capsid's own core keeps every rule, on a one-, two- and three-ring map", () => {
  for (const layout of layouts) {
    const scene = insideScene(capsidParts, capsidLinks, layout, "Inside Capsid");
    const f = faults(scene);
    for (const [rule, list] of Object.entries(f)) assert.deepEqual(list, [], `${rule} at ${layout.rings} rings`);
    assert.equal(scene.wires.length, 9, "one line for a pair named both ways");
    assert.ok(scene.wires.some((w) => w.route.length > 2), "some line bends: the test sees routing, not only straight lines");
  }
});

test("every core places its boxes inside or outside the boundary with clear space, and no line runs under a box or the boundary's name", () => {
  let routed = 0;
  let bent = 0;
  const soft = { junction: 0, side: 0, bend: 0 };
  for (const { parts, links } of randomCores(100)) for (const layout of layouts) {
    const scene = insideScene(parts, links, layout, "Inside Sample");
    const f = faults(scene);
    for (const rule of ["place", "box", "label", "port"]) assert.deepEqual(f[rule], [], `${rule} at ${layout.rings} rings (${parts.map((p) => `${p.id}:${p.kind}`).join(" ")})`);
    for (const rule of Object.keys(soft)) soft[rule] += f[rule].length;
    routed += scene.wires.length;
    bent += scene.wires.filter((w) => w.route.length > 2).length;
  }
  // Paired with how much was tried, so a pass cannot mean nothing was routed or nothing bent.
  assert.ok(routed > 1500 && bent > 100, `routed ${routed}, bent ${bent}`);
  // Random cores are far more crowded than Capsid's (up to ten parts and twenty lines), and a
  // short line between neighbours can close a whole corridor. There a route that crosses no box
  // may still break a softer rule; each stays under one line in twenty. Capsid's own core,
  // above, keeps every rule.
  for (const [rule, n] of Object.entries(soft)) assert.ok(n < routed / 20, `${rule}: ${n} of ${routed} lines`);
});

test("the checks see each fault: a line under a box, through the name, a junction, a short line crossed, side by side, a bend, one port", () => {
  const scene = insideScene(capsidParts, capsidLinks, layoutMap(family), "Inside Capsid");
  const at = new Map(scene.boxes.map((b) => [b.c.id, b]));
  const put = (from, to, route) => ({ ...scene, wires: [...scene.wires, { from, to, route }] });
  const [w, db, kv, t] = ["w", "db", "kv", "t"].map((id) => at.get(id));
  assert.ok(faults(put("w", "kv", [[w.x, w.y], [w.x, t.y], [kv.x, kv.y]])).box.length > 0, "a line under a box");
  const l = scene.label.box;
  assert.ok(faults(put("x", "y", [[l.x - 20, l.y + l.h / 2], [l.x + l.w + 20, l.y + l.h / 2]])).label.length > 0, "a line through the name");
  const first = scene.wires[0].route;
  const [p, q] = first.slice(0, 2);
  const n = [-(q[1] - p[1]), q[0] - p[0]];
  const nl = Math.hypot(...n);
  const along = (t, o) => [p[0] + (q[0] - p[0]) * t + (n[0] / nl) * o, p[1] + (q[1] - p[1]) * t + (n[1] / nl) * o];
  const near = along(4 / Math.hypot(q[0] - p[0], q[1] - p[1]), 0);
  const wp = scene.wires.find((x) => x.from === "w" && x.to === "p").route;
  const mid = [(wp[0][0] + wp[1][0]) / 2 + 20, wp[0][1]];
  assert.ok(faults(put("x", "y", [[mid[0], mid[1] - 30], [mid[0], mid[1] + 30]])).junction.length > 0, "a short line crossed away from its middle");
  assert.ok(faults(put("x", "y", [[near[0] - (n[0] / nl) * 20, near[1] - (n[1] / nl) * 20], [near[0] + (n[0] / nl) * 20, near[1] + (n[1] / nl) * 20]])).junction.length > 0, "a crossing near a line's end");
  const off = (pt) => [pt[0] + (n[0] / nl) * 4, pt[1] + (n[1] / nl) * 4];
  assert.ok(faults(put("x", "y", [off(p), off(q)])).side.length > 0, "a line beside another");
  const bendAt = [(p[0] + q[0]) / 2 + (n[0] / nl) * 6, (p[1] + q[1]) / 2 + (n[1] / nl) * 6];
  assert.ok(faults(put("x", "y", [[bendAt[0] + 200, bendAt[1] + 200], bendAt, [bendAt[0] + 200, bendAt[1] - 200]])).bend.length > 0, "a bend beside a line");
  const fromW = scene.wires.find((x) => x.from === "w");
  assert.ok(faults(put("w", "db", [fromW.route[0], [db.x, db.y - 16]])).port.length > 0, "two lines at one port");
  assert.ok(faults(put("w", "p", [[w.x, w.y - 16], [w.x, scene.boundary.cy - scene.boundary.r - 10], [at.get("p").x, at.get("p").y - 16]])).place.length > 0, "a line between two inside parts leaving the boundary");
});

test("lines that share a box leave it at their own points, spread along the side that faces their far ends", () => {
  const scene = insideScene(capsidParts, capsidLinks, layoutMap(family), "Inside Capsid");
  const w = scene.boxes.find((b) => b.c.id === "w");
  const ports = scene.wires.filter((x) => x.from === "w" || x.to === "w").map((x) => (x.from === "w" ? x.route[0] : x.route.at(-1)));
  assert.equal(new Set(ports.map((p) => p.join())).size, ports.length);
  for (const [x, y] of ports) assert.ok(Math.abs(x - w.x) <= w.w / 2 + 0.1 && Math.abs(y - w.y) <= 16.1, "a port sits on the box's edge");
});

test("the token's way runs along the drawn line, read backwards when it goes the other way, and starts off the boxes", () => {
  const way = tokenRoute("0,0 0,-100 100,-100", false);
  assert.deepEqual(way, [[92, -100], [0, -100], [0, -8]]);
  assert.deepEqual(tokenRoute("0,0 10,0", true), [[5, 0], [5, 0]]);
  const frames = routeFrames([[0, 0], [30, 0], [30, 10]]);
  assert.deepEqual(frames.map((f) => f.offset), [0, 0.75, 1]);
  assert.equal(frames[2].transform, "translate(30px, 10px)");
});
