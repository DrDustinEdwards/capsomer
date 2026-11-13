// The admin shell's page you are on, from the address: the longest match wins, "/" matches only
// itself, and an entry's own prefixes and patterns count. Correctness only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { currentEntryId, isCollapseKey } from "../../components/admin-shell/admin-shell.ts";

const nav = [
  { id: "overview", href: "/admin" },
  { id: "media", href: "/admin/media" },
  { id: "kb", href: "/admin/kb", match: ["/admin/kb", /^\/admin\/procedures?\b/] },
  { id: "home", href: "/" },
];

test("currentEntryId: the longest match wins, and a folder marks its entry", () => {
  assert.equal(currentEntryId("/admin", nav), "overview");
  assert.equal(currentEntryId("/admin/", nav), "overview");
  assert.equal(currentEntryId("/admin/media/new", nav), "media");
  assert.equal(currentEntryId("/admin/mediathing", nav), "overview");
  assert.equal(currentEntryId("/admin/procedure/12", nav), "kb");
  assert.equal(currentEntryId("/", nav), "home");
  assert.equal(currentEntryId("/blog", nav), undefined);
});

test("isCollapseKey: only the bare key, never while typing", () => {
  const key = (over = {}) => ({
    key: "[",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    defaultPrevented: false,
    isComposing: false,
    target: null,
    ...over,
  });
  assert.equal(isCollapseKey(key()), true);
  assert.equal(isCollapseKey(key({ ctrlKey: true })), false);
  assert.equal(isCollapseKey(key({ key: "]" })), false);
  assert.equal(isCollapseKey(key({ isComposing: true })), false);
  assert.equal(isCollapseKey(key({ target: { isContentEditable: true } })), false);
  assert.equal(isCollapseKey(key({ target: { closest: () => ({}) } })), false);
  assert.equal(isCollapseKey(key(), ""), false);
});
