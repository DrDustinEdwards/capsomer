// The collab editor's shared copy: every construct in the rich editor's corpus comes back byte for
// byte after a trip through Yjs (loaded into one copy, sent to another), for a site and for a book.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import * as Y from "yjs";

import { loadMarkdown, roomMarkdown } from "../../components/collab-editor/collab-editor.ts";

const dir = new URL("../fixtures/rich-editor/", import.meta.url);
for (const name of readdirSync(dir))
  test(`PLANT: gives back ${name} byte for byte after a trip through Yjs`, () => {
    const source = readFileSync(new URL(name, dir), "utf8");
    for (const dialect of ["site", "plain"]) {
      const room = new Y.Doc();
      loadMarkdown(room, { markdown: source, version: "v1", dialect });
      const copy = new Y.Doc();
      Y.applyUpdate(copy, Y.encodeStateAsUpdate(room));
      assert.equal(roomMarkdown(copy), source);
    }
  });
