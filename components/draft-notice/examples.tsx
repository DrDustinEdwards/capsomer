// Mounts the React draft notices into the mount points of examples.html.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { DraftNotice } from "./draft-notice.react.tsx";

const specimens: Record<string, ReactNode> = {
  words: (
    <DraftNotice label="Preview">Only editors at Example Co can see this version.</DraftNotice>
  ),
  hidden: <DraftNotice show={false} />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = specimens[el.dataset.mount ?? ""];
  if (node) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
