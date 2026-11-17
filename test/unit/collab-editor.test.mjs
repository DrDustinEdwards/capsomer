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

test("a document brought in as JSON keeps its suggestion out of the save, and a thread's anchor finds its words", async () => {
  const { anchorAt, roomJson, roomSchema } =
    await import("../../components/collab-editor/collab-editor.ts");
  const { initProseMirrorDoc, relativePositionToAbsolutePosition } =
    await import("@tiptap/y-tiptap");
  const insertion = { type: "insertion", attrs: { id: "g:1", by: "7", round: "Google Docs" } };
  const doc = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Harbor" }] },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "The rain came " },
          { type: "text", text: "down ", marks: [insertion] },
          { type: "text", text: "over the pier." },
        ],
      },
    ],
  };
  const room = new Y.Doc();
  loadMarkdown(room, { markdown: "", version: "v1", dialect: "plain", doc });
  assert.equal(roomMarkdown(room), "# Harbor\n\nThe rain came over the pier.\n");
  assert.equal(JSON.stringify(roomJson(room)).includes('"g:1"'), true);
  // "the pier": after the heading (8) and the paragraph's opening (1), at offset 19 of its text.
  const from = 8 + 1 + "The rain came down over ".length;
  const to = from + "the pier".length;
  const range = JSON.parse(anchorAt(room, from, to));
  const type = room.getXmlFragment("default");
  const { doc: node, mapping } = initProseMirrorDoc(type, roomSchema());
  const back = (p) =>
    relativePositionToAbsolutePosition(room, type, Y.createRelativePositionFromJSON(p), mapping);
  assert.equal(node.textBetween(back(range.from), back(range.to)), "the pier");
});
