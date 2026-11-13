import type { ReactNode } from "react";
import { formatCount } from "@drdustinedwards/site-helpers/text";
import { Icon } from "../icons/icons.react.tsx";
import { iconHeart } from "../icons/icons.ts";

export interface LikeButtonProps {
  liked: boolean;
  count: number;
  // Called with the new state. The page does the write and passes the answer back as `liked` and `count`.
  onChange?: (liked: boolean) => void;
  // The thing liked, for the name ("Like Field notes"). The name stays the same pressed or not.
  label?: string;
  pending?: boolean;
  // Signed out: the button shows the count and cannot be pressed.
  disabled?: boolean;
  error?: ReactNode;
}

// The HTML contract in like-button.md. Pending keeps focus on the button (aria-disabled, not
// disabled, which would drop it) and ignores presses.
export function LikeButton({
  liked,
  count,
  onChange,
  label,
  pending,
  disabled,
  error,
}: LikeButtonProps) {
  return (
    <div className="cap-like">
      <button
        type="button"
        className="cap-like-button"
        aria-pressed={liked}
        aria-busy={pending ? "true" : undefined}
        aria-disabled={pending ? "true" : undefined}
        disabled={disabled}
        onClick={() => {
          if (!pending) onChange?.(!liked);
        }}
      >
        <Icon d={iconHeart} />
        <span className="cap-sr-only">{label ? `Like ${label}` : "Like"}, </span>
        <span>{formatCount(count)}</span>
      </button>
      {error ? (
        <p className="cap-like-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
