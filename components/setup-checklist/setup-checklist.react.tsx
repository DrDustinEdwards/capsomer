import { useId, type ReactNode } from "react";
import { Panel } from "../panel/panel.react.tsx";
import { Row, RowList } from "../row-list/row-list.react.tsx";
import { Status } from "../status/status.react.tsx";

export interface SetupStep {
  id: string;
  title: ReactNode;
  // What the step does for the person: "Customers see this name in recovery emails".
  detail?: ReactNode;
  done: boolean;
  // The way to do it, while it is not done: a link styled as a button.
  action?: ReactNode;
}

export interface SetupChecklistProps {
  // The panel's heading. Default "Getting started".
  title?: ReactNode;
  steps: readonly SetupStep[];
  // The last row, done once every step is: "You're ready", and what happens now.
  ready?: { title: ReactNode; detail?: ReactNode };
  level?: 2 | 3;
}

// A new account's first steps: each one Done or To do, with its one way to do it until it is done,
// and how many are done beside the heading. Rows are read, not opened.
export function SetupChecklist({
  title = "Getting started",
  steps,
  ready,
  level,
}: SetupChecklistProps) {
  const headingId = useId();
  const done = steps.filter((s) => s.done).length;
  const all = done === steps.length;
  const mark = (on: boolean) =>
    on ? <Status tone="ok">Done</Status> : <Status tone="nodata">To do</Status>;
  return (
    <Panel
      title={title}
      level={level}
      headingId={headingId}
      meta={`${done} of ${steps.length} done`}
    >
      <RowList labelledBy={headingId} gap="sm">
        {steps.map((s) => (
          <Row
            key={s.id}
            variant="outline"
            status={mark(s.done)}
            title={s.title}
            detail={s.detail}
            actions={s.done ? undefined : s.action}
          />
        ))}
        {ready ? (
          <Row variant="outline" status={mark(all)} title={ready.title} detail={ready.detail} />
        ) : null}
      </RowList>
    </Panel>
  );
}
