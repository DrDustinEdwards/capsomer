// Inside every system: what a circle holds (system-map-circles.ts), drawn at build time, and how
// systemMapHtml puts the circles into the map. The systems are invented.
import assert from "node:assert/strict";
import { test } from "node:test";

import { circleLayers, faultsOf, layoutScene, sceneOf } from "../../components/system-map/system-map-circles.ts";
import { layoutMap, modelMapData, systemMapHtml } from "../../components/system-map/system-map.ts";

const data = () =>
  modelMapData({
    systems: [
      { id: "core", name: "Core", family: "system", ring: "core", description: "Runs it all." },
      { id: "kit", name: "Kit", family: "plumbing", ring: "shared", description: "Shared parts." },
      { id: "app", name: "App", family: "product", ring: "used", description: "What people use." },
      { id: "hidden", name: "Hidden", domain: "hidden.example.org", family: "product", ring: "used", private: true },
    ],
    containers: [
      { id: "core-worker", system: "core", name: "Worker", kind: "worker", technology: "Cloudflare Worker" },
      { id: "core-db", system: "core", name: "core-db", kind: "database", technology: "D1" },
      { id: "core-github", system: "core", name: "GitHub", kind: "external", technology: "GitHub" },
      { id: "app-worker", system: "app", name: "App Worker", kind: "worker", technology: "Cloudflare Worker" },
    ],
    relationships: [
      { from: "core-worker", to: "core-db", kind: "reads" },
      { from: "core-worker", to: "core-github", kind: "writes" },
      { from: "core", to: "kit", kind: "installs" },
      { from: "core-worker", to: "app-worker", kind: "serves" },
      { from: "core", to: "app", kind: "serves" },
      { from: "core", to: "hidden", kind: "coordinates" },
    ],
  });

test("a circle holds its parts, what it works with outside on the rim, and every system it connects to", () => {
  const scene = sceneOf(data(), "core");
  const roles = Object.fromEntries(scene.nodes.map((n) => [n.id, n.role]));
  assert.deepEqual(roles, { "core-worker": "part", "core-db": "part", "core-github": "outside", "system:kit": "system", "system:app": "system", "system:hidden": "system" });
  assert.equal(scene.nodes.find((n) => n.id === "system:hidden")?.private, true);
  // Each wire from the exact part that uses it; a line between systems as wholes from the circle,
  // unless a part of this system already wires to that system (app).
  assert.deepEqual(scene.wires.map((w) => `${w.from} ${w.to}`).sort(), ["core system:hidden", "core system:kit", "core-worker core-db", "core-worker core-github", "core-worker system:app"]);
  assert.deepEqual(scene.wires.filter((w) => w.loose).map((w) => w.to), ["system:hidden"], "a line that coordinates is loose");
});

test("the drawing places every box apart and no wire under a box, parts inside the circle and the rim outside", () => {
  const l = layoutScene(sceneOf(data(), "core"), layoutMap(data().systems).viewBox[2]);
  assert.deepEqual(faultsOf(l), []);
  for (const n of l.nodes.filter((n) => n.role === "part")) assert.ok(Math.hypot(Math.abs(n.x) + n.w / 2, Math.abs(n.y) + n.h / 2) <= l.r, `${n.id} is inside the circle`);
  for (const n of l.nodes.filter((n) => n.role !== "part")) assert.ok(Math.abs(n.y) - n.h / 2 >= 0 && Math.hypot(n.x, n.y) > l.r, `${n.id} is outside the circle`);
});

test("a system with no parts draws its name and summary in the middle, and its links on the rim", () => {
  const layers = circleLayers(data());
  assert.deepEqual(Object.keys(layers).sort(), ["app", "core", "hidden", "kit"]);
  assert.doesNotMatch(layers.hidden, /cap-system-map-box/, "a private system with no parts draws no box");
  assert.match(layers.hidden, /class="cap-system-map-inside-name"[^>]*>Hidden</);
  assert.match(layers.kit, /class="cap-system-map-inside-text"[^>]*>Shared parts.</);
  assert.match(layers.kit, /class="cap-system-map-rim" data-goto="core"/);
  for (const [id, svg] of Object.entries(layers)) assert.match(svg, new RegExp(`^<svg class="cap-system-map-layer" data-layer="inside" data-system="${id}" viewBox="[^"]+" aria-hidden="true"`));
});

test("a saved circle whose key still matches is used as it is, and one for a system gone is dropped", () => {
  const saved = {};
  const first = circleLayers(data(), { saved });
  assert.deepEqual(Object.keys(saved).sort(), ["app", "core", "hidden", "kit"]);
  // A planted name inside the saved core shows it is read back, not searched for again.
  saved.core.layout.name = "Planted";
  saved.gone = { key: "x", layout: saved.kit.layout };
  const again = circleLayers(data(), { saved });
  assert.match(again.core, />Planted</);
  assert.equal(again.app, first.app);
  assert.ok(!("gone" in saved));
});

test("with circles the map carries the layers given, the core's first, and a chosen system is drawn zoomed into", () => {
  const layers = circleLayers(data());
  const rest = systemMapHtml(data(), { id: "family", circles: { src: "/insides.json" } });
  assert.doesNotMatch(rest, /data-layer="inside"/, "the core's own inside is not drawn: the circles replace it");
  assert.match(rest, /<figure class="cap-system-map" data-cap="system-map"[^>]* data-circles data-insides="\/insides.json">/);
  assert.match(rest, /<button type="button" class="cap-btn" data-cap-part="out" hidden>Back to all systems<\/button>/);

  const all = systemMapHtml(data(), { id: "family", circles: { layers: { app: layers.app, core: layers.core } } });
  assert.deepEqual([...all.matchAll(/data-layer="inside" data-system="([^"]+)"/g)].map((m) => m[1]), ["core", "app"], "the core's first: its flows play on it");

  const zoomed = systemMapHtml(data(), { id: "family", circles: { layers: { app: layers.app }, chosen: "app" } });
  assert.match(zoomed, / data-selected data-entered data-zoom="app">/);
  assert.match(zoomed, /data-layer="inside" data-system="app" data-shown/);
  assert.match(zoomed, /data-id="app"[^>]* aria-pressed="true"/);
  assert.match(zoomed, /data-id="core"[^>]* data-linked/);
  assert.match(zoomed, /data-from="core" data-to="app" data-kind="serves" data-on/);
  assert.match(zoomed, /data-cap-part="out">Back to all systems/);
});

test("the model's families become the map's words and groups", () => {
  const systems = Object.fromEntries(data().systems.map((s) => [s.id, [s.tag, s.group]]));
  assert.deepEqual(systems, { core: [undefined, undefined], kit: ["shared", undefined], app: ["app", "Apps"], hidden: ["app", "Apps"] });
});
