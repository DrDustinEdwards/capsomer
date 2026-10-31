// The link prefetch rule: a prefetch runs the target's loader, so a link that acts on a GET, opens
// elsewhere or leaves the app must never prefetch.
import assert from "node:assert/strict";
import { test } from "node:test";
import { mayPrefetch } from "../../components/link/link.ts";

const from = "/";

test("an ordinary in-app link prefetches, query and hash included", () => {
  assert.equal(mayPrefetch({ href: "/meetings/fall/program?day=2#talks", from }), true);
});

test("never-prefetch paths, files, other documents and other sites do not", () => {
  for (const href of ["/logout", "/sign-out", "/api/auth/session", "/auth/google/start", "/Admin/posts", "/admin", "/feed.RSS", "/paper.pdf?x=1", "https://example.com/", "//example.com/x", "mailto:a@example.com"]) {
    assert.equal(mayPrefetch({ href, from }), false, href);
  }
  assert.equal(mayPrefetch({ href: "/administer", from }), true, "a prefix is a whole segment");
  assert.equal(mayPrefetch({ href: "/x", from, reloadDocument: true }), false);
  assert.equal(mayPrefetch({ href: "/x", from, target: "_blank" }), false);
  assert.equal(mayPrefetch({ href: "/x", from, target: "_self" }), true);
  assert.equal(mayPrefetch({ href: "/x", from, download: "" }), false);
});

test("/admin prefetches only from inside /admin; the app's own exclusions hold everywhere", () => {
  assert.equal(mayPrefetch({ href: "/admin/posts", from: "/admin" }), true);
  const exclude = ["/b/:project/export", "/admin/view-as"];
  assert.equal(mayPrefetch({ href: "/b/handbook/export/epub", from, exclude }), false);
  assert.equal(mayPrefetch({ href: "/b/handbook/outliner", from, exclude }), true);
  assert.equal(mayPrefetch({ href: "/admin/view-as/stop", from: "/admin/customers", exclude }), false);
});
