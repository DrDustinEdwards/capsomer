import assert from "node:assert/strict";
import { test } from "node:test";

import { routeHydrates, startSite } from "../../components/document/document.ts";

test("routeHydrates: a handle's flag or its function of the loader data", () => {
  assert.equal(routeHydrates([{ handle: {} }, { handle: { hydrate: true } }]), true);
  assert.equal(
    routeHydrates([{ handle: { hydrate: (d) => d.player }, loaderData: { player: false } }]),
    false,
  );
  assert.equal(
    routeHydrates([{ handle: { hydrate: (d) => d.player }, loaderData: { player: true } }]),
    true,
  );
  assert.equal(routeHydrates([{ handle: { hydrate: "yes" } }, {}]), false);
});

test("startSite: a part that throws is reported and the rest still run", () => {
  const ran = [];
  const errors = [];
  const failed = startSite(
    [
      () => ran.push("header"),
      () => {
        throw new Error("island");
      },
      () => ran.push("tabs"),
    ],
    (e) => errors.push(e.message),
  );
  assert.deepEqual(ran, ["header", "tabs"]);
  assert.deepEqual(errors, ["island"]);
  assert.equal(failed, 1);
});
