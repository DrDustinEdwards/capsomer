// Mounts the document archive specimens. Every element with data-mount="<state>" gets that state.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { seriesPlace } from "../series-nav/series-nav.ts";
import {
  DocumentArchive,
  DocumentList,
  DocumentViewer,
  type ArchiveDoc,
} from "./document-archive.react.tsx";

const REPORTS: ArchiveDoc[] = [
  {
    key: "annual-report-2026",
    title: "Annual report 2026",
    href: "#annual-report-2026",
    detail: "Fall 2026 · Editor: Alex Rivera",
    meta: "PDF, 4.2 MB",
  },
  {
    key: "annual-report-2025",
    title: "Annual report 2025",
    href: "#annual-report-2025",
    detail: "Fall 2025 · Editor: Sam Lee",
    meta: "PDF, 3.8 MB",
  },
  {
    key: "annual-report-2024",
    title: "Annual report 2024",
    href: "#annual-report-2024",
    detail: "Fall 2024 · Editor: Sam Lee",
    meta: "PDF, 3.1 MB",
  },
];

const NOTES: ArchiveDoc[] = [
  {
    key: "field-notes-spring",
    title: "Field notes, spring",
    href: "#field-notes-spring",
    detail: "Spring 2026 · Editor: Jordan Park",
  },
  {
    key: "release-notes-4",
    title: "Release notes, version 4",
    href: "#release-notes-4",
    detail: "Spring 2025",
  },
];

function Page({ at, level = 2 }: { at: string; level?: 1 | 2 }) {
  const doc = REPORTS.find((d) => d.key === at) ?? REPORTS[0]!;
  const { previous, next } = seriesPlace(REPORTS, at, (d) => d.key);
  return (
    <DocumentViewer
      title={doc.title}
      level={level}
      subtitle={doc.detail}
      download={{ href: `${doc.href}.pdf`, bytes: 4_404_019 }}
      prev={previous}
      next={next}
      collection={`Annual reports (${at})`}
    >
      <div className="archive-viewer">
        <p>
          The app's PDF viewer goes here. <a href={`${doc.href}.pdf`}>Open the PDF</a>
        </p>
      </div>
    </DocumentViewer>
  );
}

const SPECIMENS: Record<string, () => ReactNode> = {
  archive: () => (
    <DocumentArchive
      level={3}
      groups={[
        {
          id: "reports",
          title: "Annual reports",
          docs: REPORTS.slice(0, 2),
          href: "#reports",
          more: "All 3 annual reports",
        },
        { id: "notes", title: "Field notes", docs: NOTES },
        {
          id: "updates",
          title: "Spring updates",
          docs: [],
          empty: "Spring updates are being added and will be listed here.",
        },
      ]}
    />
  ),
  list: () => <DocumentList docs={REPORTS} label="Annual reports" />,
  page: () => <Page at="annual-report-2025" />,
  first: () => <Page at="annual-report-2026" />,
  last: () => <Page at="annual-report-2024" />,
  narrow: () => (
    <div className="cap-archive">
      <DocumentList docs={NOTES} label="Field notes, phone width" />
      <DocumentViewer
        title="Field notes, summer"
        level={2}
        prev={{ title: "Field notes, autumn, with the long survey appendix", href: "#autumn" }}
        next={{ title: "Release notes, version 4", href: "#release-notes-4" }}
        collection="Field notes, phone width"
      />
    </div>
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
