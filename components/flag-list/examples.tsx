// Mounts the React specimen: the same list drawn by <FlagList>, holding its own flags and the
// draft text, as an app's editor page would.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { FlagList, type FlagData } from "./flag-list.react.tsx";

const TEXT = "The watcher checks 9 sites. Most failures last under a minute. Teh rest need a person.";

const FLAGS: FlagData[] = [
  { id: "r1", kind: "blocking", state: "open", message: "Most failures: no figure", cause: "A claim of degree needs a number.", raisedBy: "Sources check", anchor: { id: "react-draft", quote: "Most failures last under a minute" } },
  { id: "r2", kind: "advisory", state: "open", message: "Spelling: Teh", cause: "Words are spelt as the dictionary spells them.", raisedBy: "Spelling check", anchor: { id: "react-draft", quote: "Teh rest" }, suggestion: { replacement: "The rest", by: "Spelling check" } },
  { id: "r3", kind: "advisory", state: "resolved", resolution: "resolved", resolvedBy: "Rosa Park", resolvedAt: "2026-10-02T07:30:00Z", message: "Number of sites differs from the sites page", cause: "Numbers agree with the page they name.", anchor: { id: "react-draft", quote: "9 sites" } },
];

function Held() {
  const [text, setText] = useState(TEXT);
  return (
    <>
      <div className="cap-field">
        <label className="cap-label" htmlFor="react-draft">
          Draft text
        </label>
        <textarea className="cap-input" id="react-draft" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <FlagList label="Flags on this draft (React)" flags={FLAGS} text={text} onTextChange={setText} owner ownerName="Dustin Edwards" viewer="Dustin Edwards" />
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
