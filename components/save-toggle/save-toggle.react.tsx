import { useSyncExternalStore } from "react";
import { isSaved, savedRaw, subscribeSaved, toggleSaved } from "./save-toggle.ts";

export interface SaveToggleProps {
  // The localStorage key the site keeps its saved ids under ("example-saved").
  storageKey: string;
  // This item's id (a post's slug).
  id: string;
  // The one label; aria-pressed and the filled bookmark carry whether it is saved.
  label?: string;
}

const ICON = <path d="M4 2.5h8v11L8 10.5l-4 3z" />;

// The HTML contract in save-toggle.md. The server and hydration render it unpressed; the stored
// state follows once the page runs, and so does another tab's change.
export function SaveToggle({
  storageKey,
  id,
  label = "Save",
}: SaveToggleProps) {
  const saved = isSaved(
    useSyncExternalStore(
      subscribeSaved,
      () => savedRaw(storageKey),
      () => "[]",
    ),
    id,
  );
  return (
    <button
      type="button"
      className="cap-chip cap-save"
      data-size="sm"
      aria-pressed={saved}
      onClick={() => toggleSaved(storageKey, id)}
    >
      <svg
        className="cap-save-icon"
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        focusable="false"
      >
        {ICON}
      </svg>
      <span className="cap-save-label">{label}</span>
    </button>
  );
}
