// Mounts the specimens: NotFoundReport on invented counts, with the window held in state as a
// route's search parameter would hold it.
import { StrictMode, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { NotFoundReport, type NotFoundRow } from "./not-found-report.react.tsx";

const NOW = Date.parse("2026-11-10T12:00:00Z");
const MONTH: NotFoundRow[] = [
  {
    path: "/blog/spring-update/",
    hits: 41,
    referrers: [
      { host: "news.example.org", hits: 30 },
      { host: "", hits: 11 },
    ],
    lastSeen: "2026-11-10T09:12:00Z",
  },
  {
    path: "/guides/getting-started.html",
    hits: 12,
    referrers: [{ host: "example.com", hits: 12 }],
    lastSeen: "2026-11-08T17:40:00Z",
  },
  {
    path: "/annual-report/2025/appendix-b/tables-and-figures-for-the-full-year-including-every-region",
    hits: 1,
    referrers: [],
    lastSeen: "2026-10-21T06:05:00Z",
  },
];
const WEEK = MONTH.slice(0, 2).map((r) => ({ ...r, hits: Math.ceil(r.hits / 3) }));

function Report() {
  const [days, setDays] = useState(30);
  return (
    <NotFoundReport
      rows={days === 7 ? WEEK : MONTH}
      days={days}
      windows={[7, 30]}
      onWindow={setDays}
      now={NOW}
      actions={(row) => (
        <a className="cap-btn" data-size="sm" href={`#redirect${row.path}`}>
          Add a redirect<span className="cap-sr-only"> for {row.path}</span>
        </a>
      )}
    />
  );
}

const mounts: Record<string, () => ReactElement> = {
  report: () => <Report />,
  plain: () => (
    <NotFoundReport
      title="Missing pages, 30 days"
      rows={MONTH.map((r) => ({ path: r.path, hits: r.hits, referrers: r.referrers }))}
      days={30}
      probes={214}
      now={NOW}
    />
  ),
  empty: () => <NotFoundReport title="404s (none)" rows={[]} days={7} />,
  reason: () => (
    <NotFoundReport
      title="404s (not reported)"
      rows={[]}
      days={30}
      reason="This site does not report its 404s yet."
    />
  ),
  loading: () => <NotFoundReport title="404s (reading)" rows={[]} days={30} loading />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
