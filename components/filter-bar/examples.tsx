// Mounts the filter bar specimens. Every element with data-mount="<state>" gets that state.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { countText } from "../content/content.ts";
import { FilterBar } from "./filter-bar.react.tsx";

function Fields({ id }: { id: string }) {
  return (
    <>
      <div className="cap-field">
        <label className="cap-field-label" htmlFor={`${id}-q`}>
          Name or email
        </label>
        <input className="cap-input" id={`${id}-q`} type="search" name="q" defaultValue="rivera" />
      </div>
      <div className="cap-field">
        <label className="cap-field-label" htmlFor={`${id}-status`}>
          Status
        </label>
        <span className="cap-select-wrap">
          <select className="cap-select" id={`${id}-status`} name="status" defaultValue="open">
            <option value="">Any</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </span>
      </div>
    </>
  );
}

const SPECIMENS: Record<string, () => ReactNode> = {
  plain: () => (
    <FilterBar
      label="Filter people"
      action="#"
      clearHref="#"
      count={countText(3, 40, { noun: "person", plural: "people" })}
    >
      <Fields id="plain" />
    </FilterBar>
  ),
  live: () => (
    <FilterBar
      label="Filter jobs"
      action="#"
      live
      clearHref="#"
      count={countText(12, 40, { noun: "job", plural: "jobs" })}
    >
      <Fields id="live" />
    </FilterBar>
  ),
  empty: () => (
    <FilterBar
      label="Filter drafts"
      action="#"
      clearHref={null}
      count={countText(40, 40, { noun: "draft", plural: "drafts" })}
    >
      <Fields id="empty" />
    </FilterBar>
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
