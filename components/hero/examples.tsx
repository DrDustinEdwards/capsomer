// Mounts the hero specimens. Headings are h2: the states page has its own h1.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Hero } from "./hero.react.tsx";

const actions = (
  <>
    <a className="cap-btn" data-variant="primary" href="#start">
      Get started
    </a>
    <a className="cap-btn" href="#tour">
      Take the tour
    </a>
  </>
);

const SPECIMENS: Record<string, () => ReactNode> = {
  start: () => (
    <Hero
      headingLevel="h2"
      eyebrow="Release notes"
      title="Every change, written down once"
      lead="Example Co keeps its release notes in one place, so every team reads the same words."
      actions={actions}
      note="Free for teams of five or fewer."
      aside={
        <div className="cap-panel">
          <div className="cap-panel-body">
            <p>Spring update: 14 changes, 3 fixes.</p>
          </div>
        </div>
      }
    />
  ),
  center: () => (
    <Hero
      headingLevel="h2"
      align="center"
      title="Field notes, together"
      lead="Share a notebook with your team."
      actions={actions}
    />
  ),
  card: () => (
    <Hero
      headingLevel="h2"
      card
      title="Annual report"
      lead="What the year looked like, in numbers and words."
      actions={actions}
      backdrop={<div className="hero-specimen-backdrop" />}
    />
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
