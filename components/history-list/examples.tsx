// Mounts the React specimen: the same contract as the HTML above, from the wrapper, with the
// app's part written out (it adds the new line when a restore happens, and removes it on Undo).
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MessageProvider } from "../message/message.react.tsx";
import { HistoryList, type HistoryEntry } from "./history-list.react.tsx";

const NOW = Date.parse("2026-10-02T15:00:00Z");

const ENTRIES: HistoryEntry[] = [
  { id: "r-5", kind: "edit", who: "Dustin Edwards", at: "2026-10-02T14:52:00Z", words: 1954, summary: "Added the 2019 burst size paper and its caveat" },
  { id: "r-4", kind: "publish", who: "Dustin Edwards", at: "2026-10-02T14:45:00Z", words: 1912, summary: "Published the reading list", destinations: [{ name: "dustinedwards.info", status: "live" }, { name: "TXASM newsletter", status: "queued" }] },
  { id: "r-3", kind: "autosave", who: "Dustin Edwards", at: "2026-10-02T14:40:00Z", words: 1912, summary: "Autosaved after a pause" },
  { id: "r-2", kind: "autosave", who: "Dustin Edwards", at: "2026-10-02T14:20:00Z", words: 1890, summary: "Autosaved while typing" },
  { id: "r-1", kind: "named", who: "Rosa Park", at: "2026-10-01T16:10:00Z", words: 1854, summary: "Cut the duplicate paragraph on prophage induction", name: "Before the rewrite", delta: -30 },
];

function Demo() {
  const [entries, setEntries] = useState(ENTRIES);
  return (
    <HistoryList
      entries={entries}
      label="History, from the React wrapper"
      user="Dustin Edwards"
      compareBase="/posts/phage-lambda/compare"
      now={NOW}
      olderHref="?before=r-1"
      onRestore={({ entry }) => setEntries((cur) => [entry, ...cur])}
      onUndoRestore={({ entry }) => setEntries((cur) => cur.filter((e) => e.id !== entry.id))}
    />
  );
}

const mount = document.getElementById("react-history");
if (mount) {
  createRoot(mount).render(
    <StrictMode>
      <MessageProvider>
        <Demo />
      </MessageProvider>
    </StrictMode>,
  );
}
