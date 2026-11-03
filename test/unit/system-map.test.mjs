// The system map's reading of the data, imported straight from the TypeScript source: the module
// touches no DOM until a controller is made. Only the tricky parts: a part's line counts as its
// system's tie, a flow lights only the parts of the system shown, and every text is escaped.
import assert from "node:assert/strict";
import { test } from "node:test";
import { flowsOver, modelMapData, systemMapHtml, tiesOf } from "../../components/system-map/system-map.ts";

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
  assert.match(net, /<li class="cap-system-map-card" data-id="site" data-uses="kit" data-used-by="core" data-link><h4 class="cap-system-map-card-name"><a href="\/s\/site">Site &lt;one&gt;<\/a><\/h4>/);
  assert.match(net, /data-id="app"[^>]* data-private>.*private<\/span>/);
  assert.equal([...net.matchAll(/class="cap-system-map-card"/g)].length, 4);
  const one = systemMapHtml(data, { id: "s", system: "core", flow: { id: "f", step: 2 } });
  assert.match(one, /data-level="system" data-system="core" id="s" aria-labelledby="s-title" data-flow="f" data-step="2">/);
  assert.match(one, /data-id="w" data-place="runs" data-lit data-at>.*writes to store/);
  assert.match(one, /data-id="gh" data-place="outside" data-lit>/);
  assert.doesNotMatch(one, /data-id="db"[^>]*data-lit/);
  assert.match(one, /<li data-toward="w" data-lights="w gh" aria-current="step">Reads.<\/li>/);
  assert.match(one, /publishes to Site &lt;one&gt;/);
});

test("the public model keeps each part's words and gives what people use its group", () => {
  const out = modelMapData(
    {
      systems: [{ id: "a", name: "A", ring: "used", family: "product", domain: "" }],
      relationships: [],
      containers: [{ id: "c", system: "a", name: "C", kind: "worker", technology: "Worker", description: "Does it." }],
    },
    (id) => `/s/${id}/`
  );
  assert.deepEqual(out.systems[0], { id: "a", name: "A", ring: "used", private: undefined, group: "Apps", description: undefined, domain: undefined, href: "/s/a/" });
  assert.equal(out.containers?.[0]?.description, "Does it.");
});
