// Mounts RichText in the browser, where React sets the stored HTML with innerHTML through the
// capsomer Trusted Types policy.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { RichText } from "./trusted-html.react.tsx";

const STATEMENT =
  '<p>Example Co wants every page of this site to work for everyone, with a keyboard, a screen reader or a phone. We test each release against <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> 2.2 AA.</p><p>Found something that does not work? Write to <a href="mailto:access@example.com">access@example.com</a> and we will answer within two working days.</p>';

const TITLES = [
  { id: "t-1", html: "Field notes on <em>Quercus alba</em> leaf litter" },
  { id: "t-2", html: "Release notes for H<sub>2</sub>O sensors" },
  { id: "t-3", html: "" },
];

// A style that reaches RichText past its types (a spread from elsewhere) is dropped.
const smuggled = { style: { maxWidth: "65ch" } } as unknown as object;

const specimens: Record<string, ReactNode> = {
  measure: <RichText html={STATEMENT} measure id="sample-measure" {...smuggled} />,
  inline: (
    <ul aria-label="Abstracts" id="sample-titles">
      {TITLES.map((t) => (
        <li key={t.id}>
          <b>
            <RichText
              as="span"
              html={t.html}
              fallback={<span className="cap-muted">Untitled</span>}
            />
          </b>
        </li>
      ))}
    </ul>
  ),
  paragraph: (
    <RichText
      as="p"
      className="sample-lead"
      id="sample-paragraph"
      html="The <strong>Annual report</strong> gathers a year of Getting started notes in one place."
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const node = specimens[el.dataset.mount ?? ""];
  if (node) createRoot(el).render(<StrictMode>{node}</StrictMode>);
}
