// Mounts the inspector specimens. Every element with data-mount="<state>" gets that state. A phone
// width is the same specimen in a narrow viewport: the spec sets it, so the sheet is tested where
// it is drawn.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Inspector, type InspectorTab } from "./inspector.react.tsx";

const TABS: InspectorTab[] = [
  { value: "details", label: "Details", content: <p>Title, summary and tags.</p> },
  { value: "checks", label: "Checks", count: 2, content: <p>Two open checks.</p> },
  { value: "history", label: "History", content: <p>Twelve versions.</p> },
  // A tab with nothing to show today is left out.
  { value: "comments", label: "Comments", content: null },
];

const head = <p className="cap-muted">Saved 2 minutes ago.</p>;

const SPECIMENS: Record<string, () => React.ReactNode> = {
  wide: () => <Inspector label="About this post" head={head} tabs={TABS} />,
  asked: () => <Inspector label="About this draft" tabs={TABS} initialTab="checks" />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
