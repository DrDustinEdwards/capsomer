// Mounts the React specimen: the compare with its view held in the app's own state, and the
// view named beside it so a test can read what the app was told.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { DraftCompare } from "./draft-compare.react.tsx";
import type { CompareView } from "./draft-compare.ts";

const before = { title: "Draft 5", who: "Dustin Edwards", time: "2026-09-30T08:00:00Z", text: "The deploy job runs at six. It posts a note to the feed when it finishes. A failed run pages nobody." };
const after = { title: "Draft 6", who: "Dustin Edwards", time: "2026-09-30T08:25:00Z", text: "The deploy job runs at seven. It posts a note to the feed when it finishes. A failed run pages nobody, and says why." };

function Held() {
  const [view, setView] = useState<CompareView>("inline");
  return (
    <>
      <DraftCompare before={before} after={after} view={view} onViewChange={setView} id="cmp-react" />
      <p className="cap-muted" data-view-chosen={view}>
        The app holds the view: {view}
      </p>
    </>
  );
}

for (const el of document.querySelectorAll<HTMLElement>("[data-mount='react']")) {
  createRoot(el).render(
    <StrictMode>
      <Held />
    </StrictMode>,
  );
}
