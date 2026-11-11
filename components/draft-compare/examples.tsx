// Mounts the React specimen: the compare with its view held in the app's own state, and the
// view named beside it so a test can read what the app was told.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { DraftCompare, DraftMerge } from "./draft-compare.react.tsx";
import { merged, mergePlan, type CompareView } from "./draft-compare.ts";

const before = {
  title: "Draft 5",
  who: "Alex Rivera",
  time: "2026-09-30T08:00:00Z",
  text: "The deploy job runs at six. It posts a note to the feed when it finishes. A failed run pages nobody.",
};
const after = {
  title: "Draft 6",
  who: "Alex Rivera",
  time: "2026-09-30T08:25:00Z",
  text: "The deploy job runs at seven. It posts a note to the feed when it finishes. A failed run pages nobody, and says why.",
};

function Held() {
  const [view, setView] = useState<CompareView>("inline");
  return (
    <>
      <DraftCompare
        before={before}
        after={after}
        view={view}
        onViewChange={setView}
        id="cmp-react"
      />
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

// The merge mode: a person's unsaved text against a newer saved copy, over the version both
// started from. The merged text is shown once applied, so a test can read what the app got.
const base = [
  "---",
  'title: "Spring update"',
  "tags: [release-notes]",
  "---",
  "",
  "The release ships on Monday.",
  "",
  "Search is faster.",
  "",
  "Thanks to everyone who tested it.",
  "",
].join("\n");
const mine = base
  .replace("ships on Monday.", "ships on Tuesday.")
  .replace("Thanks to everyone", "Thanks, as ever, to everyone");
const theirs = base
  .replace("Search is faster.", "Search is twice as fast.")
  .replace("Thanks to everyone", "Thanks to all")
  .replace("tags: [release-notes]", "tags: [release-notes, search]");

function Merging() {
  const [plan] = useState(() => mergePlan(mine, theirs, base));
  const [text, setText] = useState<string | null>(null);
  return (
    <>
      <DraftMerge plan={plan} onApply={(picks) => setText(merged(plan, picks))} />
      {text === null ? null : (
        <pre className="cap-muted" data-merged="">
          {text}
        </pre>
      )}
    </>
  );
}

for (const el of document.querySelectorAll<HTMLElement>("[data-mount='merge']")) {
  createRoot(el).render(
    <StrictMode>
      <Merging />
    </StrictMode>,
  );
}
