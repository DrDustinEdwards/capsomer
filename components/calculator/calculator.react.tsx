import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  checkTag,
  resultView,
  textParts,
  type CalculatorField,
  type CalculatorRun,
  type ViewNode,
} from "./calculator.ts";

export type { CalculatorField, CalculatorResult, CalculatorRun, ViewNode } from "./calculator.ts";

/** A view node as React: the same markup the behavior module builds. */
export function renderNode(node: ViewNode | string, key: number): ReactNode {
  if (typeof node === "string") return <Fragment key={key}>{node}</Fragment>;
  const Tag = checkTag(node.tag);
  return (
    <Tag key={key} className={node.className}>
      {node.children.map(renderNode)}
    </Tag>
  );
}

function Hint({ field }: { field: CalculatorField }) {
  return (
    <>
      {field.hint
        ? textParts(field.hint).map((part, i) =>
            part.sup ? <sup key={i}>{part.text}</sup> : <Fragment key={i}>{part.text}</Fragment>,
          )
        : null}
      {field.hint && field.source ? " " : null}
      {field.source ? (
        <>
          {field.sourceLead ?? "Default:"} <a href={field.source.href}>{field.source.label}</a>.
        </>
      ) : null}
    </>
  );
}

export interface CalculatorProps {
  // Keys the ids, so one calculator can sit on a page several times ("loan-step-3").
  id: string;
  // The page that answers the form with script off: the form is a plain GET to it.
  action: string;
  fields: CalculatorField[];
  // The opening values, usually from the address (initialValues(fields, params)).
  values: Record<string, string>;
  // The site's arithmetic: values in, a result out. It runs on the server and on every input.
  run: CalculatorRun;
  // The name a site's enhance() call looks up `run` by, on a page that is not hydrated.
  calculator?: string;
  // Inside another page (a procedure step): the form still submits to `action`, but typing does not
  // write the address.
  embedded?: boolean;
  submitLabel?: string;
  // Shown after the result: a link to the calculator's own page, a note.
  children?: ReactNode;
}

// The HTML contract in calculator.md. Hydrated, the values are React state and the result follows
// them; server-rendered with no hydration, the site's enhance() call does the same with the same run.
export function Calculator(props: CalculatorProps) {
  const {
    id,
    action,
    fields,
    values: start,
    run,
    calculator = id,
    embedded = false,
    submitLabel = "Calculate",
    children,
  } = props;
  const [values, setValues] = useState(start);
  const root = useRef<HTMLDivElement>(null);
  const live = useRef(false);
  const view = resultView(run(values));

  // React owns this one: a later enhance() call on the page leaves it alone.
  useEffect(() => {
    if (root.current) root.current.dataset.capReady = "";
  }, []);
  useEffect(() => {
    if (embedded || !live.current) return;
    const url = new URL(window.location.href);
    for (const [name, value] of Object.entries(values)) url.searchParams.set(name, value);
    window.history.replaceState(window.history.state, "", url);
  }, [embedded, values]);

  const onInput = (event: FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget);
    const next: Record<string, string> = {};
    for (const field of fields) next[field.name] = String(data.get(field.name) ?? "").slice(0, 40);
    live.current = true;
    setValues(next);
  };

  return (
    <div
      ref={root}
      className="cap-calculator"
      data-cap="calculator"
      data-calculator={calculator}
      data-embedded={embedded ? "" : undefined}
    >
      <form
        className="cap-calculator-form"
        method="get"
        action={action}
        onInput={onInput}
        onSubmit={(event) => {
          event.preventDefault();
          onInput(event);
        }}
      >
        {fields.map((field) => {
          const inputId = `${id}-${field.name}`;
          const helpId = `${inputId}-help`;
          const described = Boolean(field.hint || field.source);
          return (
            <div className="cap-field" key={field.name}>
              <label className="cap-field-label" htmlFor={inputId}>
                {field.label}
                {field.unit ? <span className="cap-calculator-unit"> ({field.unit})</span> : null}
              </label>
              {described ? (
                <p className="cap-field-help" id={helpId}>
                  <Hint field={field} />
                </p>
              ) : null}
              <input
                className="cap-input"
                id={inputId}
                name={field.name}
                type="text"
                inputMode={field.inputMode ?? "decimal"}
                autoComplete="off"
                spellCheck={false}
                defaultValue={start[field.name]}
                aria-describedby={described ? helpId : undefined}
              />
            </div>
          );
        })}
        <button type="submit" className="cap-btn" data-variant="secondary">
          {submitLabel}
        </button>
      </form>
      <div className="cap-calculator-output">
        <div className="cap-calculator-status" role="status">
          {view.summary.map(renderNode)}
        </div>
        <div className="cap-calculator-detail">{view.detail.map(renderNode)}</div>
        {children}
      </div>
    </div>
  );
}
