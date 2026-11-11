// Mounts the specimens that React draws: a value off the list, and the editor in a form.
import { StrictMode, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { colorLabels } from "./label-color-list.ts";
import { ColorLabelPill, LabelColorEditor } from "./label-color-list.react.tsx";

const STAGES = colorLabels("Idea", "Drafting", "Ready", "Scheduled");

const mounts: Record<string, () => ReactElement> = {
  unknown: () => (
    <p className="cap-specimen-row">
      <ColorLabelPill labels={STAGES} value="drafting" />
      <ColorLabelPill labels={STAGES} value="Waiting on Sam Lee" />
    </p>
  ),
  editor: () => (
    <form method="post" aria-label="Edit the stages" onSubmit={(e) => e.preventDefault()}>
      <LabelColorEditor labels={STAGES} />
    </form>
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}
