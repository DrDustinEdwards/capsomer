// The form hooks' pure parts, imported straight from the TypeScript source.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLEAN_DRAFT,
  createSaveQueue,
  draftAfter,
  draftDirty,
  filterParams,
  pagePending,
} from "../../components/form-hooks/form-hooks.ts";

test("save queue: a change mid-save waits, and several make one more save", () => {
  let sent = 0;
  const q = createSaveQueue(() => (sent += 1));
  q.change();
  q.change();
  q.change();
  assert.equal(sent, 1, "the second and third wait for the first");
  q.settled();
  assert.equal(sent, 2, "one owed save, not two");
  q.settled();
  assert.equal(sent, 2, "nothing owed");
  q.change();
  assert.equal(sent, 3, "idle again: saves at once");
});

test("draft: an edit typed while the save was in flight stays unsaved", () => {
  let s = draftAfter(CLEAN_DRAFT, { type: "edit" });
  s = draftAfter(s, { type: "submit" });
  s = draftAfter(s, { type: "edit" });
  s = draftAfter(s, { type: "saved" });
  assert.equal(draftDirty(s), true);
  s = draftAfter(s, { type: "submit" });
  s = draftAfter(s, { type: "saved" });
  assert.equal(draftDirty(s), false);
});

test("filterParams: keeps the named, sets the fixed, trims and drops empty values", () => {
  const from = new URLSearchParams("tab=checks&page=3&q=old");
  const next = filterParams(from, { q: "  new ", agent: " " }, ["tab"], { view: "list" });
  assert.equal(next.toString(), "tab=checks&view=list&q=new");
});

test("pagePending: this page reading again, not leaving for another", () => {
  const here = "/admin/users";
  assert.equal(pagePending({ state: "idle" }, "loading", here), true);
  assert.equal(
    pagePending({ state: "loading", location: { pathname: "/admin/users/" } }, "idle", here),
    true,
  );
  assert.equal(
    pagePending({ state: "loading", location: { pathname: "/admin" } }, "idle", here),
    false,
  );
  assert.equal(
    pagePending({ state: "submitting", location: { pathname: here } }, "idle", here),
    false,
  );
});
