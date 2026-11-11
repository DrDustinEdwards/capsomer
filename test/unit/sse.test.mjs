// Server-sent event framing: the standard's line endings, the leading space, comments, an unended last event, and a
// multi-byte character split across two chunks.
import assert from "node:assert/strict";
import { test } from "node:test";
import { jsonData, parseEvent, readSse, takeEvents } from "../../components/sse/sse.ts";

test("one space after the colon is framing; more is data; comments and empty data are skipped", () => {
  assert.deepEqual(parseEvent("event: cut\ndata:  two\n: a comment\ndata:x"), { event: "cut", data: " two\nx" });
  assert.equal(parseEvent(": keep-alive"), null);
  assert.deepEqual(parseEvent("data"), { event: "message", data: "" });
});

test("CRLF, LF and CR all end lines and events", () => {
  const { events, rest } = takeEvents("data: a\r\n\r\ndata: b\n\ndata: c\r\rdata: d");
  assert.deepEqual(events.map((e) => e.data), ["a", "b", "c"]);
  assert.equal(rest, "data: d");
});

test("a stream: chunks split anywhere, a character split across chunks, and an unended last event", async () => {
  const bytes = new TextEncoder().encode('data: {"t":"café"}\n\nevent: cut\ndata: end');
  const at = bytes.indexOf(0xc3) + 1;
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(bytes.slice(0, at));
      c.enqueue(bytes.slice(at));
      c.close();
    },
  });
  const seen = [];
  await readSse(stream, (e) => seen.push(e));
  assert.deepEqual(jsonData(seen[0]), { t: "café" });
  assert.deepEqual(seen[1], { event: "cut", data: "end" });
  assert.equal(jsonData({ event: "message", data: "[DONE]" }), undefined);
});
