// Mounts the generated-file specimens. Every element with data-mount="<state>" gets that state.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { GeneratedRecord } from "./generated-file.ts";
import { GeneratedFile } from "./generated-file.react.tsx";

const NOW = Date.parse("2027-02-20T15:00:00Z");
const MADE = "2027-02-19T21:04:00Z";
const BYTES = 2_516_582;

function Panel({
  record,
  busy,
  children,
}: {
  record: GeneratedRecord | null;
  busy?: boolean;
  children?: ReactNode;
}) {
  return (
    <GeneratedFile
      title="Annual report PDF"
      level={3}
      description="Made from the report's sections. It can take up to a minute."
      record={record}
      now={NOW}
      downloadHref="#download"
      fields={{ intent: "generate" }}
      action="#generate"
      busy={busy}
    >
      {children}
    </GeneratedFile>
  );
}

const SPECIMENS: Record<string, () => ReactNode> = {
  none: () => <Panel record={null} />,
  generating: () => <Panel record={{ status: "generating", startedAt: NOW - 20_000 }} />,
  regenerating: () => (
    <Panel
      record={{ status: "generating", startedAt: NOW - 20_000, generatedAt: MADE, bytes: BYTES }}
    />
  ),
  ready: () => (
    <Panel record={{ status: "ready", generatedAt: MADE, bytes: BYTES }}>
      <button type="button" className="cap-btn">
        Publish to the archive
      </button>
    </Panel>
  ),
  stale: () => (
    <Panel
      record={{
        status: "ready",
        generatedAt: MADE,
        bytes: BYTES,
        changedAt: "2027-02-20T10:30:00Z",
      }}
    />
  ),
  failed: () => (
    <Panel
      record={{
        status: "failed",
        startedAt: NOW - 600_000,
        reason: "The renderer did not answer within 60 seconds.",
      }}
    />
  ),
  stalled: () => <Panel record={{ status: "generating", startedAt: NOW - 600_000 }} />,
  busy: () => <Panel record={{ status: "ready", generatedAt: MADE, bytes: BYTES }} busy />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
