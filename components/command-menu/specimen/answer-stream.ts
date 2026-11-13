// The answer specimens' AI answer (with React and without): a fake stream that sends its
// sources, then the answer in three pieces 150 ms apart, as a server would, read by the ask panel.
import { ask, type AskRead } from "../../ask-panel/ask-panel.ts";
import type { SseEvent } from "../../sse/sse.ts";

const enc = new TextEncoder();
const delta = (text: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
const FRAMES = [
  `event: sources\ndata: ${JSON.stringify([
    { url: "/notes/field-notes", title: "Field notes" },
    { url: "/notes/spring-update#plots", title: "Spring update", kind: "section" },
  ])}\n\n`,
  delta("Field notes are kept "),
  delta("for each spring survey, "),
  delta("one page per plot."),
];

const request = async (signal: AbortSignal) =>
  new Response(
    new ReadableStream({
      async start(c) {
        for (const f of FRAMES) {
          await new Promise((r) => setTimeout(r, 150));
          if (signal.aborted) return;
          c.enqueue(enc.encode(f));
        }
        c.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );

const read = (e: SseEvent): AskRead =>
  e.event === "sources"
    ? { sources: JSON.parse(e.data) }
    : { delta: JSON.parse(e.data).choices[0].delta.content };

export const sampleAnswer = {
  label: "Ask AI about this",
  run: (_query: string, region: HTMLElement) => ask(region, { request, read }),
};
