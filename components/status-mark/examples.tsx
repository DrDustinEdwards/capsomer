// Mounts the one-purpose page specimens.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ResultPage } from "./status-mark.react.tsx";

const back = (
  <a className="cap-btn" data-variant="quiet" href="#home">
    Return to Example Co
  </a>
);

const SPECIMENS: Record<string, () => ReactNode> = {
  done: () => (
    <ResultPage title="Unsubscribed" tone="ok" actions={back}>
      You have been unsubscribed. You will not get any more of these emails.
    </ResultPage>
  ),
  invalid: () => (
    <ResultPage title="Link not valid" tone="crit" actions={back}>
      This unsubscribe link is invalid or has expired.
    </ResultPage>
  ),
  confirm: () => (
    <ResultPage
      title="Unsubscribe"
      actions={
        <>
          <button type="submit" className="cap-btn" data-variant="primary">
            Unsubscribe
          </button>
          {back}
        </>
      }
    >
      Confirm to stop getting these emails.
    </ResultPage>
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
