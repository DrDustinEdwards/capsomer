import {
  useEffect,
  useRef,
  type ComponentType,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import { liveSubmit, SEARCH_DELAY_MS } from "./filter-bar.ts";

export { clearedHref, isFiltered, withParams, type Params } from "./filter-bar.ts";

// A list's filters in the address (filter-bar.md): a GET form named as a search landmark, its
// fields, Apply and Clear, and the count of what is shown in a polite live region. With no script
// Apply sends the form; `live` applies as you type (after a pause, never mid-composition) and on
// each change of a select or a box, and hides Apply.

// Only the props FilterBar passes, so React Router's Form (whose method and encType are unions)
// fits without a cast.
type FormLike = ComponentType<{
  method?: "get";
  action?: string;
  role?: string;
  "aria-label"?: string;
  className?: string;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  ref?: Ref<HTMLFormElement>;
  replace?: boolean;
  preventScrollReset?: boolean;
  children?: ReactNode;
}>;

export interface FilterBarProps {
  // The landmark's name: "Filter payments".
  label: string;
  // The fields: Capsomer field, select, segmented, range, chips.
  children: ReactNode;
  // The count line ("Showing 12 of 40 payments", countText from capsomer/content) or null.
  count?: ReactNode;
  // The address with the filters cleared, or null when nothing is filtered (Clear is hidden).
  clearHref?: string | null;
  // The form to render: React Router's Form keeps a client navigation; a plain form otherwise.
  Form?: FormLike | "form";
  action?: string;
  live?: boolean;
  delay?: number;
  applyLabel?: string;
  // "primary" when Apply is the view's main action (a search page); the default button otherwise.
  applyVariant?: "default" | "primary";
  clearLabel?: string;
  // The link Clear renders, for a router link (capsomer/react/link Link); a plain a otherwise.
  renderLink?: (props: { href: string; className: string; children: ReactNode }) => ReactNode;
  // For an app whose router is not React Router (a wouter SPA): handle the submit yourself, read
  // the fields with `new FormData(e.currentTarget)` and navigate. Call e.preventDefault().
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  className?: string;
}

export function FilterBar(props: FilterBarProps) {
  const {
    label,
    children,
    count,
    clearHref,
    Form = "form",
    action,
    live = false,
    delay = SEARCH_DELAY_MS,
    applyLabel = "Apply",
    applyVariant = "default",
    clearLabel = "Clear filters",
    renderLink,
    onSubmit,
    className,
  } = props;
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = ref.current;
    if (!live || !form) return;
    return liveSubmit(form, delay);
  }, [live, delay]);
  const clear =
    clearHref == null ? null : renderLink ? (
      renderLink({ href: clearHref, className: "cap-btn", children: clearLabel })
    ) : (
      <a className="cap-btn" href={clearHref}>
        {clearLabel}
      </a>
    );
  const body = (
    <>
      <div className="cap-filter-bar-fields">{children}</div>
      <div className="cap-filter-bar-actions">
        {/* Kept for no script and for Enter; hidden from sight when live, still a submit, and
            out of the tab order then, since a focused control nobody can see fails 2.4.7. */}
        <button
          type="submit"
          className={live ? "cap-sr-only" : "cap-btn"}
          tabIndex={live ? -1 : undefined}
          data-variant={live || applyVariant === "default" ? undefined : applyVariant}
        >
          {applyLabel}
        </button>
        {clear}
      </div>
      <p className="cap-filter-bar-count" role="status">
        {count ?? ""}
      </p>
    </>
  );
  const attrs = {
    method: "get" as const,
    action,
    role: "search",
    "aria-label": label,
    className: className ? `cap-filter-bar ${className}` : "cap-filter-bar",
    "data-cap": "filter-bar",
    "data-cap-ready": "",
    "data-live": live ? "" : undefined,
    onSubmit,
  };
  if (Form === "form")
    return (
      <form ref={ref} {...attrs}>
        {body}
      </form>
    );
  return (
    <Form ref={ref} {...attrs} replace={live} preventScrollReset>
      {body}
    </Form>
  );
}
