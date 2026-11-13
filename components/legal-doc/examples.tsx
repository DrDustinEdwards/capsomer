// Mounts the legal page specimen.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { LegalDoc } from "./legal-doc.react.tsx";

const SPECIMENS: Record<string, () => ReactNode> = {
  doc: () => (
    <LegalDoc
      headingLevel="h2"
      title="Privacy policy"
      updated="2026-11-11"
      intro={<p>Example Co runs example.com. This page says what it keeps and why.</p>}
      sections={[
        {
          id: "what-we-keep",
          title: "What we keep",
          body: <p>Your email address, so we can send the sign-in link, and nothing else.</p>,
        },
        {
          id: "who-sees-it",
          title: "Who sees it",
          body: (
            <ul>
              <li>Alex Rivera, who runs the site.</li>
              <li>The email service that sends the link.</li>
            </ul>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Write to <a href="mailto:privacy@example.com">privacy@example.com</a>.
            </p>
          ),
        },
      ]}
    />
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
