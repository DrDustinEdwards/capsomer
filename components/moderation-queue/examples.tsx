// Mounts the React specimen: the same contract as the HTML above, from the wrapper.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MessageProvider } from "../message/message.react.tsx";
import { ModerationQueue, type Mention } from "./moderation-queue.react.tsx";

const NOW = Date.parse("2026-10-02T15:00:00Z");

const ITEMS: Mention[] = [
  { id: "r-1", author: "Rosa Park", host: "fieldnotes.example", url: "https://fieldnotes.example/2026/lambda-decision", excerpt: "Lysogeny is not a failure to lyse.", post: "Phage lambda: lysis or lysogeny", postHref: "/posts/phage-lambda", at: "2026-10-02T13:10:00Z", state: "waiting" },
  { id: "r-2", author: "Sam Okafor", host: "bacteriophage.example", url: "https://bacteriophage.example/lab/meeting-notes", excerpt: "Cited your reading list in this week's lab meeting notes.", post: "Phage lambda: lysis or lysogeny", postHref: "/posts/phage-lambda", at: "2026-10-02T11:40:00Z", state: "waiting" },
  { id: "r-3", author: "Kai Anders", host: "oldblog.example", url: "https://oldblog.example/2026/09/lambda", excerpt: "A long reply about lambda that the author has since taken down.", post: "Phage lambda: lysis or lysogeny", postHref: "/posts/phage-lambda", at: "2026-09-29T20:00:00Z", state: "waiting", gone: true, goneAt: "2026-10-01T09:12:00Z" },
  { id: "r-4", author: "Jon Alvarez", host: "jonalvarez.example", url: "https://jonalvarez.example/notes/agents", excerpt: "A careful account of what a read-only agent can and cannot do.", post: "Notes on a read-only agent", postHref: "/posts/read-only-agent", at: "2026-09-21T10:10:00Z", state: "approved", decidedAt: "2026-09-22T08:00:00Z" },
  { id: "r-5", author: "Dev Patel", host: "devpatel.example", url: "https://devpatel.example/notes/phage", excerpt: "Not sure this is about the same paper at all.", post: "Phage lambda: lysis or lysogeny", postHref: "/posts/phage-lambda", at: "2026-09-29T15:30:00Z", state: "bin", decidedAt: "2026-09-30T09:00:00Z" },
];

const mount = document.getElementById("react-queue");
if (mount) {
  createRoot(mount).render(
    <StrictMode>
      <MessageProvider>
        <ModerationQueue items={ITEMS} label="Mentions, from the React wrapper" now={NOW} />
      </MessageProvider>
    </StrictMode>,
  );
}
