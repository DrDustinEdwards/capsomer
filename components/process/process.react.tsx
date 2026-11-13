import type { ReactNode } from "react";

export interface ProcessStep {
  title: ReactNode;
  text?: ReactNode;
  // A small mark beside the step (a status pill), drawn between the title and the text.
  tag?: ReactNode;
  // A stable key when titles repeat.
  id?: string;
}

export interface ProcessStepsProps {
  steps: ProcessStep[];
  // "columns": side by side where there is room (how it works). "rows": a list of rows, the number at the left.
  layout?: "columns" | "rows";
  // Rows only: no card per row, a rule between rows.
  flush?: boolean;
  // The level of each step's title.
  headingLevel?: "h2" | "h3" | "h4" | "p";
  label?: string;
}

// The HTML contract in process.md.
export function ProcessSteps({
  steps,
  layout = "columns",
  flush,
  headingLevel: H = "h3",
  label,
}: ProcessStepsProps) {
  return (
    <div
      className="cap-process"
      data-layout={layout === "rows" ? "rows" : undefined}
      data-flush={flush ? "" : undefined}
    >
      <ol className="cap-process-list" aria-label={label}>
        {steps.map((step, i) => (
          <li className="cap-process-step" key={step.id ?? i}>
            <H className="cap-process-title">{step.title}</H>
            {step.tag ? <span className="cap-process-tag">{step.tag}</span> : null}
            {step.text ? <p className="cap-process-text">{step.text}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
