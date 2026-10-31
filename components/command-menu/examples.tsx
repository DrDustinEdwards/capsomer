// Mounts the React command menu's live-search specimen: the catalog is searched as the person
// types, through a fake source that answers after 300 ms. Titles are samples.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CommandMenu, type Command } from "./command-menu.react.tsx";

const CATALOG = ["Getting started with the editor", "Release notes for version 4", "Annual report 2025", "Field notes", "The spring update, in full", "Billing"];

function Live() {
  const [open, setOpen] = useState(true);
  const [said, setSaid] = useState("");
  const ran = (label: string) => () => setSaid(`Ran: ${label}`);
  const commands: Command[] = [
    { id: "go-workspace", label: "Your workspace", group: "Go to", run: ran("Your workspace") },
    { id: "go-calendar", label: "Calendar", group: "Go to", run: ran("Calendar") },
  ];
  const search = (q: string, signal: AbortSignal) =>
    new Promise<Command[]>((resolve, reject) => {
      const t = setTimeout(() => {
        const hits = CATALOG.filter((b) => b.toLowerCase().includes(q.toLowerCase()));
        resolve([{ id: "search-all", label: `Search all results for “${q}”`, group: "Search", run: ran(`Search ${q}`) }, ...hits.map((b) => ({ id: `article-${b}`, label: b, group: "Articles", run: ran(b) }))]);
      }, 300);
      signal.addEventListener("abort", () => (clearTimeout(t), reject(signal.reason)));
    });
  return (
    <>
      <main className="specimen-page" tabIndex={-1}>
        <h1>Home</h1>
        <p>
          <button type="button" className="cap-btn" onClick={() => setOpen(true)}>
            Search
          </button>
        </p>
        <p role="status" data-specimen-part="said">
          {said}
        </p>
      </main>
      <CommandMenu open={open} onOpenChange={setOpen} commands={commands} search={search} label="Search articles" placeholder="Search articles and pages" bindKeys={false} />
    </>
  );
}

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  if (el.dataset.mount === "live") createRoot(el).render(<StrictMode><Live /></StrictMode>);
}
