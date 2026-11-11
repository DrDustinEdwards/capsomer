// Mounts the save bar specimens. Every element with data-mount="<state>" gets that state.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { SaveBar } from "./save-bar.react.tsx";

const SPECIMENS: Record<string, () => ReactNode> = {
  idle: () => <SaveBar state="idle" />,
  saving: () => <SaveBar state="saving" />,
  saved: () => <SaveBar state="saved" />,
  failed: () => <SaveBar state="failed" failed="The sender address is not verified yet." />,
  autosave: () => <SaveBar state="saved" autosave />,
  sticky: () => (
    <SaveBar state="idle" sticky disabledReason="Turn on disputes to save these settings.">
      <button type="button" className="cap-btn">
        Check
      </button>
    </SaveBar>
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
