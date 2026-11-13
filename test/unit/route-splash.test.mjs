// The route splash's rule: a plain navigation still loading, to a path the app names; never the
// revalidation after a form post (which is also "loading", with the post's method).
import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldShowRouteSplash } from "../../components/route-splash/route-splash.ts";

const isSplashPath = (p) => p === "/settings";

test("splashes only a plain navigation that is still loading, to a named path", () => {
  const to = (pathname) => ({ pathname });
  assert.equal(
    shouldShowRouteSplash({ state: "loading", location: to("/settings") }, isSplashPath),
    true,
  );
  assert.equal(
    shouldShowRouteSplash({ state: "loading", location: to("/settings/") }, isSplashPath),
    true,
  );
  assert.equal(
    shouldShowRouteSplash({ state: "idle", location: to("/settings") }, isSplashPath),
    false,
  );
  assert.equal(
    shouldShowRouteSplash(
      { state: "loading", formMethod: "POST", location: to("/settings") },
      isSplashPath,
    ),
    false,
  );
  assert.equal(
    shouldShowRouteSplash({ state: "loading", location: to("/settings/team") }, isSplashPath),
    false,
  );
  assert.equal(shouldShowRouteSplash({ state: "loading" }, isSplashPath), false);
});
