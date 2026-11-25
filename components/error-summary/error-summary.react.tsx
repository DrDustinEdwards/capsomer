import { useEffect, useId, useRef, type ReactNode } from "react";
import { setTitleError, wireSummary } from "./error-summary.ts";

export interface ErrorSummaryProps {
  errors: Array<{ id: string; text: ReactNode }>;
  title?: ReactNode;
}

export function ErrorSummary({ errors, title = "There is a problem" }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => (ref.current ? wireSummary(ref.current) : undefined), []);
  // Keyed on which fields are in error, not on the array: a parent that re-renders with a new array
  // of the same errors must not pull focus off the field being edited.
  const fields = errors.map((e) => e.id).join("\n");
  useEffect(() => {
    if (!fields) return;
    ref.current?.focus();
    setTitleError(true);
    return () => setTitleError(false);
  }, [fields]);
  return (
    <div
      className="cap-error-summary"
      data-cap="error-summary"
      tabIndex={-1}
      role="alert"
      aria-labelledby={titleId}
      hidden={errors.length === 0}
      ref={ref}
    >
      <h2 className="cap-error-summary-title" id={titleId}>
        {title}
      </h2>
      <ul className="cap-error-summary-list">
        {errors.map((e) => (
          <li key={e.id}>
            <a href={`#${e.id}`}>{e.text}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
