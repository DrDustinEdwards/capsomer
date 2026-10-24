// Mounts the React command menu's live-search specimen: the catalog is searched as the person
// types, through a fake source that answers after 300 ms. Titles are samples.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { CommandMenu, type Command } from "./command-menu.react.tsx";

const CATALOG = ["The Left Hand of Darkness", "The Dispossessed", "A Wizard of Earthsea", "Middlemarch", "The Remains of the Day", "Piranesi"];

function Live() {
  const [open, setOpen] = useState(true);
  const [said, setSaid] = useState("");
  const ran = (label: string) => () => setSaid(`Ran: ${label}`);
  const commands: Command[] = [
    { id: "go-library", label: "Your library", group: "Go to", run: ran("Your library") },
    { id: "go-diary", label: "Diary", group: "Go to", run: ran("Diary") },
  ];
  const search = (q: string, signal: AbortSignal) =>
    new Promise<Command[]>((resolve, reject) => {
      const t = setTimeout(() => {
        const hits = CATALOG.filter((b) => b.toLowerCase().includes(q.toLowerCase()));
        resolve([{ id: "search-all", label: `Search all results for “${q}”`, group: "Search", run: ran(`Search ${q}`) }, ...hits.map((b) => ({ id: `book-${b}`, label: b, group: "Books", run: ran(b) }))]);
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
      <CommandMenu open={open} onOpenChange={setOpen} commands={commands} search={search} label="Search books" placeholder="Search books and pages" bindKeys={false} />
    </>
  );
}

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  if (el.dataset.mount === "live") createRoot(el).render(<StrictMode><Live /></StrictMode>);
}
