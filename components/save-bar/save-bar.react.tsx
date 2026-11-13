import type { ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { Status } from "../status/status.react.tsx";

export interface SaveBarProps {
  // A save in flight: the button shows its spinner.
  pending?: boolean;
  // The last save worked: "Saved" in the status region.
  saved?: boolean;
  // The last save failed, in words: "Failed to save. Please try again."
  error?: ReactNode;
  // The button's words.
  submit?: ReactNode;
  // False leaves the button out (a form with nothing to save yet); the status region stays.
  button?: boolean;
}

// The foot of a settings form: the result, then the Save button, at the end of the form. The
// status region is on the page from the start, so the result is announced when it arrives.
export function SaveBar({
  pending = false,
  saved = false,
  error,
  submit = "Save changes",
  button = true,
}: SaveBarProps) {
  return (
    <div className="cap-save-bar">
      <p role="status" className="cap-save-bar-status">
        {saved && !error ? <Status tone="ok">Saved</Status> : null}
        {error ? <Status tone="crit">{error}</Status> : null}
      </p>
      {button ? (
        <Button type="submit" variant="primary" pending={pending}>
          {submit}
        </Button>
      ) : null}
    </div>
  );
}
