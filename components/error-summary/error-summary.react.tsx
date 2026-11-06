import { useEffect, useId, useRef, type ReactNode } from "react";
import { setTitleError, wireSummary } from "./error-summary.ts";

export interface ErrorSummaryProps {
  // One per field in error: the control's id and the same words as the message beside it.
  errors: Array<{ id: string; text: ReactNode }>;
  title?: ReactNode;
}

// The error summary for a React form: pass the errors found on submit. A new errors list takes
// focus and puts "Error: " on the page title; an empty one renders the summary hidden.
export function ErrorSummary({ errors, title = "There is a problem" }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => (ref.current ? wireSummary(ref.current) : undefined), []);
  useEffect(() => {
    if (errors.length === 0) return;
    ref.current?.focus();
    setTitleError(true);
    return () => setTitleError(false);
  }, [errors]);
  return (
    <div className="cap-error-summary" data-cap="error-summary" tabIndex={-1} role="alert" aria-labelledby={titleId} hidden={errors.length === 0} ref={ref}>
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
