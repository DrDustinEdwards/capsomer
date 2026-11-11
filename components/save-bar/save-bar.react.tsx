import type { ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { Status } from "../status/status.react.tsx";

// The row that ends a settings form (save-bar.md): the result, then any other action, then the
// primary Save, right-aligned. The result sits in a polite live region that is in the page from
// the start, so "Saved" or the failure is heard without moving focus. An autosaving form has no
// button: `autosave` shows Saving..., then the result; a success fades after a few seconds.

export type SaveState = "idle" | "saving" | "saved" | "failed";

export const SAVE_WORDS = {
  saving: "Saving…",
  saved: "Saved",
  failed: "Failed to save. Please try again.",
} as const;

export interface SaveBarProps {
  state: SaveState;
  // The failure's own words (the server's reason); SAVE_WORDS.failed when not given.
  failed?: ReactNode;
  saved?: ReactNode;
  // The Save button's words. Ignored with `autosave`.
  label?: ReactNode;
  // Another action before Save (Cancel, Reset).
  children?: ReactNode;
  // No button: the form saves on change, and the bar only says what happened. "Saved" fades
  // from sight after three seconds (save-bar.css); its words stay for a screen reader's review.
  autosave?: boolean;
  // Why Save cannot be used yet (a feature that is off); the button stays, aria-disabled, and
  // says why (button.md).
  disabledReason?: ReactNode;
  // The bar stays at the bottom of the window while a long form scrolls.
  sticky?: boolean;
  // The form the button submits, when the bar sits outside it.
  form?: string;
  // The button's name and value, for a page with several forms posting to one action.
  name?: string;
  value?: string;
  className?: string;
}

export function SaveBar(props: SaveBarProps) {
  const {
    state,
    failed,
    saved,
    label = "Save changes",
    children,
    autosave = false,
    disabledReason,
    sticky = false,
    form,
    name,
    value,
    className,
  } = props;
  return (
    <div
      className={className ? `cap-save-bar ${className}` : "cap-save-bar"}
      data-autosave={autosave ? "" : undefined}
      data-sticky={sticky ? "" : undefined}
    >
      <p className="cap-save-bar-result" role="status">
        {autosave && state === "saving" ? <span>{SAVE_WORDS.saving}</span> : null}
        {state === "saved" ? <Status tone="ok">{saved ?? SAVE_WORDS.saved}</Status> : null}
        {state === "failed" ? <Status tone="crit">{failed ?? SAVE_WORDS.failed}</Status> : null}
      </p>
      {children}
      {autosave ? null : (
        <Button
          type="submit"
          variant="primary"
          pending={state === "saving"}
          disabledReason={disabledReason}
          form={form}
          name={name}
          value={value}
        >
          {label}
        </Button>
      )}
    </div>
  );
}
