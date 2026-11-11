import type { ReactNode } from "react";

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

const HEART = "M12 20.5l-1.4-1.3C6 15.1 3 12.4 3 9.1 3 6.6 5 4.7 7.5 4.7c1.5 0 2.9.7 3.8 1.8l.7.8.7-.8c.9-1.1 2.3-1.8 3.8-1.8C21 4.7 23 6.6 23 9.1c0 3.3-3 6-7.6 10.1L12 20.5z";

// The HTML contract in like-button.md.
export function LikeButton({ liked, count, onChange, label, pending, disabled, error }: LikeButtonProps) {
  return (
    <div className="cap-like">
      <button
        type="button"
        className="cap-like-button"
        aria-pressed={liked}
        aria-busy={pending ? "true" : undefined}
        disabled={disabled || pending}
        onClick={() => onChange?.(!liked)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d={HEART} />
        </svg>
        <span className="cap-sr-only">{label ? `Like ${label}` : "Like"}, </span>
        <span>{count.toLocaleString("en-US")}</span>
      </button>
      {error ? (
        <p className="cap-like-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
