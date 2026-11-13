// Mounts the call to action band specimens.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { CtaBand } from "./cta-band.react.tsx";

const actions = (
  <a className="cap-btn" data-variant="primary" href="#start">
    Start a free trial
  </a>
);

const SPECIMENS: Record<string, () => ReactNode> = {
  band: () => (
    <CtaBand
      eyebrow="Start here"
      title="Ready to write it down?"
      actions={actions}
      note="Apps for phones are coming."
    >
      Set up a notebook in two minutes. No card needed.
    </CtaBand>
  ),
  quiet: () => (
    <CtaBand
      quiet
      title="Questions first?"
      actions={
        <a className="cap-btn" href="#contact">
          Write to us
        </a>
      }
    />
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
