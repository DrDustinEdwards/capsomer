import { useEffect, useState, type ReactNode } from "react";
import { endHelp, type TitleOption } from "./people-roles.ts";

export function Hidden({ fields }: { fields: Record<string, string> }) {
  return (
    <>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}

export function AddForm({
  id,
  Sub,
  titles,
  action,
}: {
  id: string;
  Sub: "h3" | "h4";
  titles: TitleOption[];
  action: string;
}) {
  const [title, setTitle] = useState(titles[0]?.value ?? "");
  const chosen = titles.find((t) => t.value === title) ?? titles[0];
  const [end, setEnd] = useState(chosen?.defaultEnd ?? "");
  useEffect(() => {
    if (!chosen?.defaultEnd) return;
    // oxlint-disable-next-line react/set-state-in-effect -- a new title clamps the end date someone typed to its default
    setEnd((v) => (!v || v > (chosen.defaultEnd as string) ? (chosen.defaultEnd as string) : v));
  }, [chosen?.defaultEnd]);
  const expires = !!chosen?.defaultEnd;
  return (
    <form
      className="cap-people-card cap-people-add"
      data-cap="field"
      method="post"
      action={action}
      aria-labelledby={`${id}-add`}
    >
      <Hidden fields={{ intent: "add" }} />
      <Sub id={`${id}-add`}>Add a person</Sub>
      <div className="cap-fields cap-people-add-fields">
        <Field id={`${id}-email`} label="Email">
          <input
            className="cap-input"
            id={`${id}-email`}
            name="email"
            type="email"
            required
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${id}-email-e ${id}-email-h`}
            data-error-value-missing="Type their email."
            data-error-type-mismatch="Type a full email, such as name@example.edu."
          />
        </Field>
        <Field id={`${id}-name`} label="Name">
          <input
            className="cap-input"
            id={`${id}-name`}
            name="name"
            required
            autoComplete="off"
            aria-describedby={`${id}-name-e`}
            data-error-value-missing="Type their name."
          />
        </Field>
        <Field id={`${id}-title`} label="Title">
          <div className="cap-select-wrap" data-cap="select" data-native="">
            <select
              className="cap-select"
              id={`${id}-title`}
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              {titles.map((t) => (
                <option key={t.value} value={t.value} data-end={t.defaultEnd ?? ""}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field
          id={`${id}-end`}
          label="Access ends"
          help={endHelp(chosen?.defaultEnd ?? null)}
          helpPart="end-help"
          hidden={!expires}
        >
          <input
            className="cap-input"
            id={`${id}-end`}
            name="end_date"
            type="date"
            required={expires}
            disabled={!expires}
            max={chosen?.defaultEnd ?? undefined}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-describedby={`${id}-end-e ${id}-end-h`}
            data-error-value-missing="Choose the date their access ends."
            data-error-range-overflow="Choose a date no later than the end of the term."
          />
        </Field>
      </div>
      <div className="cap-people-add-foot">
        <button type="submit" className="cap-btn" data-variant="primary">
          Add person
        </button>
        <p className="cap-people-tally">
          They can sign in once Cloudflare confirms, usually within a minute.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  help,
  helpPart,
  hidden,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  helpPart?: string;
  hidden?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="cap-field" hidden={hidden}>
      <label className="cap-field-label" htmlFor={id}>
        {label}{" "}
        <span className="cap-field-required" aria-hidden="true">
          Required
        </span>
      </label>
      {help ? (
        <p className="cap-field-help" id={`${id}-h`} data-cap-part={helpPart}>
          {help}
        </p>
      ) : null}
      {children}
      <p className="cap-field-error" id={`${id}-e`} hidden></p>
    </div>
  );
}
