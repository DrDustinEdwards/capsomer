import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";

// For useSyncExternalStore's hydration flag: nothing to subscribe to.
const noSubscribe = () => () => {};

export type ScopeOption = { value: string; label: string };
// Exactly the props the form gets, so a router's form (React Router's <Form>, whose method and
// encType are unions) takes them as they are.
export type ScopeFormProps = {
  method: "get";
  action?: string;
  className: string;
  "data-cap": string;
  "data-cap-ready"?: string;
  children: ReactNode;
};

export interface ScopeChipProps {
  // The scopes to choose from (each site, say).
  options: ScopeOption[];
  // The value in force, or "" for the unscoped choice.
  value: string;
  // The select's hidden label: what the list shows ("Show posts from").
  label: string;
  // The unscoped choice's label ("All sites"); null when the page needs one scope.
  all?: string | null;
  // The query parameter.
  name?: string;
  // Other query values to carry (a status tab, a search) when the scope changes.
  keep?: Record<string, string | undefined>;
  // Where the form goes; the current page when left out.
  action?: string;
  // The form element, for a router's own form (React Router's <Form>), so the change is a client
  // navigation. It is given every prop the plain form would get.
  renderForm?: (props: ScopeFormProps) => ReactElement;
}

// The HTML contract in scope-chip.md.
export function ScopeChip({
  options,
  value,
  label,
  all = "All",
  name = "scope",
  keep = {},
  action,
  renderForm,
}: ScopeChipProps) {
  // The Show button is for a page with no script; it goes once React runs here.
  const ready = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const children = (
    <>
      {Object.entries(keep).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      <label className="cap-scope-label">
        <span className="cap-sr-only">{label}</span>
        <select
          className="cap-select"
          name={name}
          value={value}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          {all === null ? null : <option value="">{all}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button className="cap-btn cap-scope-submit" type="submit">
        Show
      </button>
    </>
  );
  const props: ScopeFormProps = {
    method: "get",
    action,
    className: "cap-scope",
    "data-cap": "scope-chip",
    ...(ready ? { "data-cap-ready": "" } : {}),
    children,
  };
  return renderForm ? renderForm(props) : <form {...props} />;
}
