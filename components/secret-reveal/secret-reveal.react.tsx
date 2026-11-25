import { useEffect, useId, useRef, type ReactNode } from "react";

// A secret shown once (an API key, a recovery code): the secret in a block that takes focus when it appears, so a
// keyboard or screen reader lands on what has to be kept, with a warning and the app's copy button. Nothing here stores it.
export function SecretReveal({
  title,
  secret,
  note = "Shown once. Copy it now.",
  copy,
  headingLevel: H = "h2",
  focusOnShow = true,
}: {
  title: ReactNode;
  secret: string;
  note?: ReactNode;
  copy?: ReactNode;
  headingLevel?: "h2" | "h3" | "h4";
  focusOnShow?: boolean;
}) {
  const heading = useId();
  const noteId = useId();
  const block = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (focusOnShow) block.current?.focus();
  }, [focusOnShow]);
  return (
    <section className="cap-secret" aria-labelledby={heading}>
      <H className="cap-secret-title" id={heading}>
        {title}
      </H>
      <pre
        className="cap-secret-value"
        ref={block}
        tabIndex={-1}
        aria-labelledby={heading}
        aria-describedby={noteId}
      >
        {secret}
      </pre>
      <div className="cap-secret-foot">
        <p className="cap-secret-note" id={noteId}>
          {note}
        </p>
        {copy}
      </div>
    </section>
  );
}
