// Frontmatter fields: a file's frontmatter as one labeled box per key, the raw text one disclosure
// away. The app keeps the one source string; each box reads from it and writes back through setBox,
// so a key no box changed is never touched (frontmatter-fields.ts).

import { useId, useState, type ChangeEvent, type ReactNode } from "react";
import { joinSource, splitSource } from "@drdustinedwards/site-helpers/frontmatter";
import { Check, Field } from "../field/field.react.tsx";
import { setBox, typeFront, type FieldSpec, type TypedField } from "./frontmatter-fields.ts";

export interface FrontmatterFieldsProps {
  // The whole file: frontmatter fences, frontmatter and body.
  source: string;
  // The whole file again, with the change made. Left out, every box is read-only.
  onChange?: (next: string) => void;
  readOnly?: boolean;
  // What the app knows about its keys: labels, boxes, help, flag words, order.
  fields?: readonly FieldSpec[];
  // A key with no spec: a box of its own ("fields", the default) or the raw text only ("text").
  extra?: "fields" | "text";
  legend?: ReactNode;
  // Hide boxes whose key is absent and empty; on by default when read-only.
  hideEmpty?: boolean;
  // The raw text disclosure: shown by default.
  raw?: boolean;
  rawSummary?: ReactNode;
  // Shown in place of the fields when the file has no frontmatter.
  empty?: ReactNode;
  // After the boxes: the app's own controls for this item.
  children?: ReactNode;
}

// What is typed stays in the box while it has focus; the stored value is the writer's, trimmed and
// cleaned, which would otherwise move the caret and swallow a comma being typed.
export interface TypedBox {
  /** What the box shows: what is typed, else the stored value. */
  value: string;
  /** Keeps what was just typed (call from onChange). */
  keep: (typed: string) => void;
  /** Gives the box back to the stored value (call from onBlur). */
  done: () => void;
}
export function useTyped(stored: string): TypedBox {
  const [typed, setTyped] = useState<string | null>(null);
  return { value: typed ?? stored, keep: setTyped, done: () => setTyped(null) };
}

function Box({
  field,
  locked,
  write,
}: {
  field: TypedField;
  locked: boolean;
  write: (value: string) => void;
}) {
  const box = useTyped(field.value);
  const helpId = `${useId()}-help`;
  if (field.box === "flag") {
    return (
      <div className="cap-field" data-orientation="horizontal">
        <Check
          label={field.label}
          checked={field.value !== ""}
          disabled={locked}
          aria-describedby={field.help ? helpId : undefined}
          onChange={(event) => write(event.target.checked ? (field.flag?.on ?? "true") : "")}
        />
        {field.help ? (
          <p className="cap-field-help" id={helpId}>
            {field.help}
          </p>
        ) : null}
      </div>
    );
  }
  const props = {
    className: "cap-input",
    value: box.value,
    readOnly: locked,
    spellCheck: field.box === "text" || field.box === "lines" ? undefined : false,
    onBlur: box.done,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      box.keep(event.target.value);
      write(event.target.value);
    },
  };
  return (
    <Field label={field.label} help={field.help}>
      {field.box === "text" || field.box === "lines" ? (
        <textarea {...props} rows={field.box === "lines" ? 4 : 2} />
      ) : (
        <input {...props} type="text" />
      )}
    </Field>
  );
}

export function FrontmatterFields({
  source,
  onChange,
  readOnly = false,
  fields: specs = [],
  extra = "fields",
  legend = "Details",
  hideEmpty,
  raw = true,
  rawSummary = "Edit as text",
  empty = null,
  children,
}: FrontmatterFieldsProps) {
  const rawId = useId();
  const split = splitSource(source);
  const locked = readOnly || !onChange;
  const { fields, rawOnly } = typeFront(split.front, specs, { extra });
  const shown = (hideEmpty ?? locked) ? fields.filter((f) => f.present || f.value !== "") : fields;
  // With no box to show, the text is the editor, so it starts open; after that it is the reader's.
  const [startOpen] = useState(rawOnly.length > 0 && shown.length === 0);
  if (split.front === null) return <>{empty}</>;
  const front = split.front;
  const write = (f: TypedField) => (value: string) =>
    onChange?.(
      joinSource({ ...split, front: setBox(front, f.key, f.box, value, f.flag, !f.known) }),
    );
  return (
    <fieldset className="cap-fm">
      <legend className="cap-fm-legend">{legend}</legend>
      <div className="cap-fields cap-fm-grid">
        {shown.map((f) => (
          <div key={f.key} className="cap-fm-field" data-wide={f.wide ? "" : undefined}>
            <Box field={f} locked={locked} write={write(f)} />
          </div>
        ))}
        {children}
      </div>
      {raw ? (
        <details className="cap-disclosure cap-fm-raw" open={startOpen || undefined}>
          <summary>{rawSummary}</summary>
          <div className="cap-disclosure-body cap-field">
            <label className="cap-field-label" htmlFor={rawId}>
              The frontmatter as text
            </label>
            {rawOnly.length ? (
              <p className="cap-field-help" id={`${rawId}-help`}>
                Only here: {rawOnly.join(", ")}.
              </p>
            ) : null}
            <textarea
              className="cap-input cap-fm-raw-text"
              id={rawId}
              aria-describedby={rawOnly.length ? `${rawId}-help` : undefined}
              rows={Math.min(Math.max(front.split("\n").length + 1, 4), 24)}
              value={front}
              readOnly={locked}
              spellCheck={false}
              onChange={(event) => onChange?.(joinSource({ ...split, front: event.target.value }))}
            />
          </div>
        </details>
      ) : null}
    </fieldset>
  );
}

export type { FieldSpec, BoxKind, FlagWords, TypedField } from "./frontmatter-fields.ts";
export { LIST_HINT, LINES_HINT } from "./frontmatter-fields.ts";
