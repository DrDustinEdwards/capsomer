// The system map's reading of the data, imported straight from the TypeScript source: the module
// touches no DOM until a controller is made. Only the tricky parts: a part's line counts as its
// system's tie, a flow lights only the parts of the system shown, the network's lanes, the wires a
// system's page draws, and every text is escaped.
import assert from "node:assert/strict";
import { test } from "node:test";
import { flowsOver, modelMapData, networkLayout, systemMapHtml, tiesOf } from "../../components/system-map/system-map.ts";

const data = {
  systems: [
    { id: "site", name: "Site <one>", ring: "used", group: "Websites", href: "/s/site" },
    { id: "app", name: "App", ring: "used", group: "Apps", private: true },
    { id: "kit", name: "Kit", ring: "shared" },
    { id: "core", name: "Core", ring: "core" },
  ],
  relationships: [
    { from: "site", to: "kit", kind: "installs" },
    { from: "app", to: "kit", kind: "installs" },
    { from: "core", to: "site", kind: "coordinates" },
    // A part's line to another system's part ties the two systems, once, with both verbs.
    { from: "w", to: "site", kind: "publishes-to" },
    { from: "w", to: "site", kind: "watches" },
    { from: "w", to: "db", kind: "writes" },
    { from: "app-w", to: "w", kind: "reads" },
  ],
  containers: [
    { id: "w", system: "core", name: "Worker", kind: "worker", technology: "Worker" },
    { id: "db", system: "core", name: "store", kind: "database", technology: "D1" },
    { id: "gh", system: "core", name: "GitHub", kind: "external", technology: "Repos" },
    { id: "app-w", system: "app", name: "App worker", kind: "worker", technology: "Worker" },
  ],
  flows: [
    { id: "f", name: "A flow", steps: [{ from: "w", to: "db", toward: "db", text: "Writes." }, { from: "app-w", to: "w", toward: "w", lights: ["gh", "app-w"], text: "Reads." }] },
    { id: "elsewhere", name: "Not here", steps: [{ from: "site", to: "kit", toward: "kit", text: "Installs." }] },
  ],
};

test("ties are read between the systems that own each line's ends, each other system once", () => {
  const ties = tiesOf(data);
  assert.deepEqual(ties.get("core"), { uses: [{ id: "site", verbs: ["coordinates", "publishes to", "watches"] }], usedBy: [{ id: "app", verbs: ["reads"] }] });
  assert.deepEqual(ties.get("kit")?.usedBy.map((t) => t.id), ["site", "app"]);
  assert.deepEqual(ties.get("app")?.uses.map((t) => t.id), ["kit", "core"]);
});

test("a flow is shown on a system it touches, each step lighting only that system's parts", () => {
  assert.deepEqual(flowsOver(data, "core").map((f) => [f.id, f.steps.map((s) => s.lights)]), [["f", [["w", "db"], ["w", "gh"]]]]);
  assert.deepEqual(flowsOver(data, "app")[0]?.steps.map((s) => s.lights), [[], ["app-w"]]);
  assert.deepEqual(flowsOver(data, "kit"), []);
});

test("the network and a system are whole HTML, escaped, with a step lit as the script leaves it", () => {
  const net = systemMapHtml(data, { id: "n" });
  assert.match(net, /<li class="cap-system-map-card" data-id="site" data-wire="site" data-wires="kit core" data-uses="kit" data-used-by="core" data-link><h4 class="cap-system-map-card-name"><a class="cap-system-map-link" href="\/s\/site">Site &lt;one&gt;<\/a><\/h4>/);
  assert.match(net, /data-id="app"[^>]* data-private>.*private<\/span>/);
  // A card shows its short name; its full name and words stay for screen readers and the detail line.
  assert.match(systemMapHtml({ systems: [{ id: "x", name: "The long name", short: "Long", ring: "used" }] }), /<h4 class="cap-system-map-card-name">Long<\/h4><span class="cap-system-map-card-about"><span class="cap-system-map-card-full">The long name<\/span>/);
  assert.equal([...net.matchAll(/class="cap-system-map-card"/g)].length, 4);
  const one = systemMapHtml(data, { id: "s", system: "core", flow: { id: "f", step: 2 } });
  assert.match(one, /data-level="system" data-system="core" id="s" aria-labelledby="s-title" data-flow="f" data-step="2">/);
  assert.match(one, /data-id="w" data-place="runs" tabindex="0" data-wire="w" data-wires="uses:site db used-by:app" data-lit data-at>.*writes to store/);
  assert.match(one, /data-id="gh" data-place="outside" tabindex="0" data-lit>/);
  // A line from the system as a whole starts at its Inside heading; a part's line to another
  // system ends on that system in Uses (or Used by, read from the other end).
  assert.match(one, /<span data-wire="self" data-wires="uses:site">Inside Core<\/span>/);
  assert.match(one, /data-wire="used-by:app" data-wires="w"/);
  assert.doesNotMatch(one, /data-id="db"[^>]*data-lit/);
  assert.match(one, /<li data-toward="w" data-lights="w gh" aria-current="step">Reads.<\/li>/);
  assert.match(one, /publishes to Site &lt;one&gt;/);
});

test("the public model keeps each part's words, gives what people use its group, and sets each flow step on its line's ends", () => {
  const out = modelMapData(
    {
      systems: [{ id: "a", name: "A", ring: "used", family: "product", domain: "" }],
      relationships: [{ id: "a-c", from: "c", to: "a", kind: "serves" }],
      containers: [{ id: "c", system: "a", name: "C", kind: "worker", technology: "Worker", description: "Does it." }],
      flows: [{ id: "f", name: "F", steps: [{ relationship: "a-c", toward: "a", text: "Serves." }, { relationship: "gone", toward: "a", text: "Lost." }] }],
    },
    (id) => `/s/${id}/`
  );
  assert.deepEqual(out.systems[0], { id: "a", name: "A", short: undefined, ring: "used", private: undefined, group: "Apps", description: undefined, domain: undefined, href: "/s/a/" });
  assert.equal(out.containers?.[0]?.description, "Does it.");
  assert.deepEqual(out.flows?.[0]?.steps, [{ from: "c", to: "a", toward: "a", text: "Serves.", lights: undefined }]);
});

test("the network's lanes: the shared packages in the middle, each block on the side that crosses least, balanced", () => {
  const big = {
    systems: [
      { id: "s1", name: "S1", ring: "used", group: "Websites" },
      { id: "s2", name: "S2", ring: "used", group: "Websites" },
      { id: "a1", name: "A1", ring: "used", group: "Apps" },
      { id: "a2", name: "A2", ring: "used", group: "Apps" },
      { id: "w1", name: "W1", ring: "used", group: "Writing" },
      { id: "k1", name: "K1", ring: "shared" },
      { id: "k2", name: "K2", ring: "shared" },
      { id: "c", name: "C", ring: "core" },
    ],
    relationships: [
      { from: "s1", to: "k2", kind: "installs" },
      { from: "s2", to: "k1", kind: "installs" },
      { from: "a1", to: "k1", kind: "installs" },
      // Writing publishes to the websites, so it stands beside them rather than across the middle.
      { from: "w1", to: "s1", kind: "publishes-to" },
      { from: "w1", to: "s2", kind: "publishes-to" },
      { from: "c", to: "a1", kind: "coordinates" },
      { from: "c", to: "a2", kind: "coordinates" },
    ],
  };
  const lanes = networkLayout(big, { used: "Used", shared: "Shared", core: "Core" });
  const at = (lane) => lanes.find((l) => l.lane === lane).blocks.map((b) => [b.name, b.systems.map((s) => s.id)]);
  assert.deepEqual(at("middle"), [["Shared", ["k2", "k1"]]]);
  const side = (name) => lanes.find((l) => l.blocks.some((b) => b.name === name)).lane;
  assert.equal(side("Writing"), side("Websites"));
  assert.equal(side("Core"), side("Apps"));
  assert.notEqual(side("Websites"), side("Apps"));
  // Within the websites, s1 stands by k2 and s2 by k1: no two ties cross.
  assert.deepEqual(lanes.find((l) => l.lane === side("Websites")).blocks.find((b) => b.name === "Websites").systems.map((s) => s.id), ["s1", "s2"]);
});
