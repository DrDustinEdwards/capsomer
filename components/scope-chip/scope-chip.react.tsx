import { type ReactElement, type ReactNode } from "react";
import { useHydrated } from "../hooks/hooks.react.tsx";

export type ScopeOption = { value: string; label: string };
// Exactly the props the form gets, so a router's form (whose method and encType are unions) takes them as they are.
export type ScopeFormProps = {
  method: "get";
  action?: string;
  className: string;
  "data-cap": string;
  "data-cap-ready"?: string;
  children: ReactNode;
};

export interface ScopeChipProps {
  options: ScopeOption[];
  value: string;
  label: string;
  all?: string | null;
  name?: string;
  keep?: Record<string, string | undefined>;
  action?: string;
  renderForm?: (props: ScopeFormProps) => ReactElement;
}

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
  const ready = useHydrated();
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
