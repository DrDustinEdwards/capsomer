// Mounts the React count and list into the mount points of examples.html.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { CitedBy, CitedByCount, type CitingWork } from "./cited-by.react.tsx";

const WORKS: CitingWork[] = [
  {
    title: "Field notes from a second season",
    doi: "10.5555/example.2026.031",
    venue: "Example Journal of Field Notes",
    year: 2026,
  },
  {
    title: "Getting started with shared field records",
    doi: "10.5555/example.2025.118",
    venue: "Example Co Reports",
    year: 2025,
  },
  {
    title: "Annual report on open records",
    href: "https://example.org/annual-report-2025",
    year: 2025,
  },
];

const specimens: Record<string, ReactNode> = {
  count: (
    <CitedByCount
      count={12}
      href="https://example.org/works?cites=example"
      source="Example Index"
      readAt="2026-11-01"
    />
  ),
  "count-plain": <CitedByCount count={3} source="Example Index" readAt="2026-11-01" />,
  "count-zero": <CitedByCount count={0} source="Example Index" readAt="2026-11-01" />,
  list: (
    <CitedBy
      total={3}
      works={WORKS}
      source="Example Index"
      readAt="2026-11-01"
      order="Newest first."
      headingLevel={3}
    />
  ),
  capped: (
    <CitedBy
      total={40}
      works={[
        ...WORKS,
        { title: null, doi: "10.5555/example.2024.007", year: 2024 },
        { title: "Spring update" },
      ]}
      source="Example Index"
      order="Newest first."
      headingLevel={3}
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = specimens[el.dataset.mount ?? ""];
  if (node) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
