import type { ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { Status } from "../status/status.react.tsx";

export interface SaveBarProps {
  pending?: boolean;
  saved?: ReactNode;
  error?: ReactNode;
  submit?: ReactNode;
  // False leaves the button out (nothing to save yet, or it saves as each control changes); the status region stays.
  button?: boolean;
  children?: ReactNode;
  // Why Save cannot be used yet: the button stays, aria-disabled, and says why.
  disabledReason?: ReactNode;
  sticky?: boolean;
  form?: string;
  name?: string;
  value?: string;
  className?: string;
}

// The foot of a settings form. The status region is on the page from the start, so a result is announced when it arrives.
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
