import type { ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { Status } from "../status/status.react.tsx";

export interface SaveBarProps {
  // A save in flight: the button shows its spinner; with no button the region says "Saving…".
  pending?: boolean;
  // The last save worked: true says "Saved"; words say those instead ("Saved.").
  saved?: ReactNode;
  // The last save failed, in words: "Failed to save. Please try again."
  error?: ReactNode;
  // The button's words.
  submit?: ReactNode;
  // False leaves the button out: a form with nothing to save yet, or one that saves as each
  // control changes, where the bar only says what happened. The status region stays.
  button?: boolean;
  // Another action before Save (Check, Cancel, Reset).
  children?: ReactNode;
  // Why Save cannot be used yet (a feature that is off): the button stays, aria-disabled, and
  // says why (button.md).
  disabledReason?: ReactNode;
  // The bar stays on the window's bottom edge while a long form scrolls.
  sticky?: boolean;
  // The form the button submits, when the bar sits outside it.
  form?: string;
  // The button's name and value, for a form with several actions posting to one route.
  name?: string;
  value?: string;
  className?: string;
}

// The foot of a settings form: the result, any other action, then the Save button, at the end of
// the form. The status region is on the page from the start, so the result is announced when it
// arrives. "Saved" clearing itself is the host's, with useShownFor (capsomer/react/hooks).
export function SaveBar({
  pending = false,
  saved = false,
  error,
  submit = "Save changes",
  button = true,
  children,
  disabledReason,
  sticky = false,
  form,
  name,
  value,
  className,
}: SaveBarProps) {
  const failed = error != null && error !== false;
  const ok = !failed && saved != null && saved !== false;
  // With no button, a save in flight is said in words, in place of the last result.
  const saying = !button && pending;
  return (
    <div
      className={className ? `cap-save-bar ${className}` : "cap-save-bar"}
      data-sticky={sticky ? "" : undefined}
    >
      <p role="status" className="cap-save-bar-status">
        {saying ? "Saving…" : null}
        {ok && !saying ? <Status tone="ok">{saved === true ? "Saved" : saved}</Status> : null}
        {failed && !saying ? <Status tone="crit">{error}</Status> : null}
      </p>
      {children}
      {button ? (
        <Button
          type="submit"
          variant="primary"
          pending={pending}
          disabledReason={disabledReason}
          form={form}
          name={name}
          value={value}
        >
          {submit}
        </Button>
      ) : null}
    </div>
  );
}
