import { useEffect, useId, useRef, type ReactNode } from "react";

// A secret shown once (an API key, a recovery code): a heading, the secret in a block that takes
// focus when it appears, so a keyboard or screen reader lands on what has to be kept, the warning
// that it will not be shown again, and the app's copy button beside it. The page that opens it
// is the result of the action that made the secret; nothing here stores or fetches it.
export function SecretReveal({
  title,
  secret,
  note = "This will not be shown again. Copy it now and store it somewhere safe.",
  copy,
  headingLevel: H = "h2",
  focusOnShow = true,
}: {
  title: ReactNode;
  secret: string;
  note?: ReactNode;
  // The copy control: Capsomer's CopyButton with `text={secret}` and a name ("Copy API key").
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
      <pre className="cap-secret-value" ref={block} tabIndex={-1} aria-describedby={noteId}>
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
