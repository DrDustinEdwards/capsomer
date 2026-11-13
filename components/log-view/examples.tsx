// Mounts the log view specimens.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { LogView, type LogColumn } from "./log-view.react.tsx";

interface Failure {
  path: string;
  status: number;
  hits: number;
}

const columns: LogColumn<Failure>[] = [
  { key: "path", label: "Path", mono: true, cell: (f) => f.path },
  { key: "status", label: "Status", num: true, cell: (f) => f.status },
  { key: "hits", label: "Hits", num: true, cell: (f) => f.hits.toLocaleString("en-US") },
];

const rows: Failure[] = [
  {
    path: "/api/v1/books/search?q=a-very-long-query-that-does-not-fit-on-a-phone",
    status: 500,
    hits: 1204,
  },
  { path: "/media/sample-cover.webp", status: 503, hits: 88 },
  { path: "/feed.xml", status: 502, hits: 3 },
];

const SPECIMENS: Record<string, () => ReactNode> = {
  lines: () => (
    <LogView
      caption="Server errors, last 7 days"
      columns={columns}
      rows={rows}
      rowKey={(f) => `${f.path} ${f.status}`}
      note="From the edge, sampled."
      truncated
      empty="No request failed with a 5xx."
    />
  ),
  none: () => (
    <LogView
      caption="Server errors, last 7 days"
      columns={columns}
      rows={[]}
      rowKey={(f) => f.path}
      empty="No request failed with a 5xx."
    />
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
