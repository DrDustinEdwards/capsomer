import { useId, useState, type ChangeEvent, type ReactNode } from "react";

// A star rating out of five, in halves (rating.md). `Rating` shows one: an image whose name says
// the value ("3.5 out of 5 stars"), the stars drawn filled to that half. `RatingInput` asks for
// one: a native select of the half-star values (the keyboard and screen reader control every
// platform already knows), with the stars beside it showing the choice.

export const RATING_MAX = 5;

// Rounds to the nearest half within 0..5.
export function toHalves(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(RATING_MAX, Math.max(0, Math.round(value * 2) / 2));
}

export function ratingWords(value: number): string {
  const v = toHalves(value);
  return `${v} out of ${RATING_MAX} ${v === 1 ? "star" : "stars"}`;
}

function Stars({ value }: { value: number }) {
  return (
    <span
      className="cap-rating-stars"
      data-half={Math.round(toHalves(value) * 2)}
      aria-hidden="true"
    >
      <span className="cap-rating-empty">{"☆".repeat(RATING_MAX)}</span>
      <span className="cap-rating-fill">{"★".repeat(RATING_MAX)}</span>
    </span>
  );
}

export interface RatingProps {
  value: number;
  // Words after the stars ("(12 ratings)"), visible.
  children?: ReactNode;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function Rating({ value, children, size = "default", className }: RatingProps) {
  return (
    <span
      className={className ? `cap-rating ${className}` : "cap-rating"}
      data-size={size === "default" ? undefined : size}
    >
      <span role="img" aria-label={ratingWords(value)} className="cap-rating-img">
        <Stars value={value} />
      </span>
      {children ? <span className="cap-rating-note">{children}</span> : null}
    </span>
  );
}

export interface RatingInputProps {
  name: string;
  label: string;
  // Half stars, 0 for none. Uncontrolled with defaultValue, controlled with value and onChange.
  defaultValue?: number;
  value?: number;
  onChange?: (value: number) => void;
  // Words for "no rating" (the empty choice).
  noneLabel?: string;
  // Allow only whole stars.
  whole?: boolean;
  id?: string;
}

export function ratingChoices(whole = false): number[] {
  const step = whole ? 1 : 0.5;
  const out: number[] = [];
  for (let v = step; v <= RATING_MAX; v += step) out.push(v);
  return out;
}

export function RatingInput(props: RatingInputProps) {
  const {
    name,
    label,
    defaultValue = 0,
    value,
    onChange,
    noneLabel = "No rating",
    whole = false,
  } = props;
  const auto = useId();
  const id = props.id ?? auto;
  const [own, setOwn] = useState(toHalves(defaultValue));
  const shown = value === undefined ? own : toHalves(value);
  const change = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = Number(e.target.value) || 0;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  return (
    <div className="cap-field cap-rating-input">
      <label className="cap-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="cap-rating-control">
        <span className="cap-select-wrap">
          <select
            className="cap-select"
            id={id}
            name={name}
            value={shown ? String(shown) : ""}
            onChange={change}
          >
            <option value="">{noneLabel}</option>
            {ratingChoices(whole).map((v) => (
              <option key={v} value={String(v)}>
                {ratingWords(v)}
              </option>
            ))}
          </select>
        </span>
        <Stars value={shown} />
      </div>
    </div>
  );
}
