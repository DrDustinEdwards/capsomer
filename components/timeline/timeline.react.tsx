import { useEffect, useRef, type ReactNode } from "react";
import { enhance } from "./timeline.ts";

export interface TimelineStep {
  // The number in the node ("01").
  mark: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  // A decorative icon over the title (aria-hidden).
  icon?: ReactNode;
}

export interface TimelineProps {
  steps: TimelineStep[];
  // The steps' heading level on the page.
  level?: "h2" | "h3" | "h4";
  className?: string;
}

// The HTML contract in timeline.md.
export function Timeline({ steps, level: H = "h3", className }: TimelineProps) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(
    () => (ref.current?.parentElement ? enhance(ref.current.parentElement) : undefined),
    [],
  );
  return (
    <ol
      ref={ref}
      className={className ? `cap-timeline ${className}` : "cap-timeline"}
      data-cap="timeline"
    >
      {steps.map((s, i) => (
        <li className="cap-timeline-step" key={i}>
          <span className="cap-timeline-node" aria-hidden="true">
            {s.mark}
          </span>
          <div className="cap-timeline-body">
            {s.icon ? (
              <span className="cap-timeline-icon" aria-hidden="true">
                {s.icon}
              </span>
            ) : null}
            <H className="cap-timeline-title">{s.title}</H>
            {s.children ? <div className="cap-timeline-text">{s.children}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
