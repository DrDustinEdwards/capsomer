import { patchDots, type PatchOptions } from "./manual.ts";
import { Link } from "../link/link.react.tsx";

/**
 * The project's round patch (manual.ts patchSvg's contract) as React, so a page draws it without injecting markup.
 * Decorative: the page says the same in words beside it.
 */
export function Patch({ id, name, foot, count, unit }: PatchOptions) {
  const p = `cap-patch-${id}`;
  return (
    <svg className="cap-patch" viewBox="0 0 140 140" aria-hidden="true" focusable="false">
      <defs>
        <path id={`${p}-top`} d="M 22 70 A 48 48 0 0 1 118 70" />
        <path id={`${p}-foot`} d="M 27 74 A 43 43 0 0 0 113 74" />
      </defs>
      <circle className="cap-patch-rim" cx="70" cy="70" r="68" />
      <circle className="cap-patch-field" cx="70" cy="70" r="61" />
      <circle className="cap-patch-disc" cx="70" cy="70" r="36" />
      {patchDots(count).map(([cx, cy]) => (
        <circle key={`${cx},${cy}`} className="cap-patch-dot" cx={cx} cy={cy} r="3.4" />
      ))}
      <text className="cap-patch-name" textAnchor="middle">
        <textPath href={`#${p}-top`} startOffset="50%">
          {name.toUpperCase()}
        </textPath>
      </text>
      <text className="cap-patch-foot" textAnchor="middle">
        <textPath href={`#${p}-foot`} startOffset="50%">
          {foot.toUpperCase()}
        </textPath>
      </text>
      <text className="cap-patch-count" x="70" y="77" textAnchor="middle">
        {count}
      </text>
      <text className="cap-patch-unit" x="70" y="89" textAnchor="middle">
        {unit.toUpperCase()}
      </text>
    </svg>
  );
}

export interface RunningHeadProps {
  /** The section's number (manual.ts sectionOf). */
  no: string;
  /** The section's trail, joined with a middle dot. */
  trail: readonly string[];
  /** The right side: the deepest route's folio (manual.ts folioOf), else the site's name. */
  folio: string;
}

/**
 * The running head under the mast: the section's number and trail, the folio at the right, across the wide track of
 * a tracks page. Hidden from screen readers: it sits outside every landmark and says only what the h1 and the
 * breadcrumb say.
 */
export function RunningHead({ no, trail, folio }: RunningHeadProps) {
  return (
    <div className="cap-page cap-tracks cap-running-head-tracks" aria-hidden="true">
      <div className="cap-running-head" data-track="wide">
        <span className="cap-running-head-name">
          <span className="cap-running-head-no">{no}</span>
          <span className="cap-running-head-trail">{trail.join(" · ")}</span>
        </span>
        <span className="cap-running-head-folio">{folio}</span>
      </div>
    </div>
  );
}

// One way on: where it goes, its title on the sign, and the words a screen reader hears before
// the title ("Next part").
export interface SignTarget {
  href: string;
  title: string;
  label: string;
}

type Ways = SignTarget | readonly SignTarget[] | null | undefined;

const list = (ways: Ways): readonly SignTarget[] =>
  Array.isArray(ways) ? ways : ways ? [ways as SignTarget] : [];

export interface SignsProps {
  // The nav's name ("Parts of Field notes", "More in Guides").
  label: string;
  // The ways back (left arrow) and the ways on (right arrow and the family color on top).
  prev?: Ways;
  next?: Ways;
  className?: string;
}

// The manual's signs (`nav.cap-signs` of `a.cap-sign`, manual.md): a sign shows only the title,
// and its kind is read, not shown, since the arrow says it. Renders nothing with no way on.
export function Signs({ label, prev, next, className }: SignsProps) {
  const back = list(prev);
  const on = list(next);
  if (back.length === 0 && on.length === 0) return null;
  const sign = (target: SignTarget, rel: "prev" | "next") => (
    <Link key={`${rel}:${target.href}`} className="cap-sign" rel={rel} to={target.href}>
      <span className="cap-sr-only">{target.label}: </span>
      {target.title}
    </Link>
  );
  return (
    <nav className={className ? `cap-signs ${className}` : "cap-signs"} aria-label={label}>
      {back.map((t) => sign(t, "prev"))}
      {on.map((t) => sign(t, "next"))}
    </nav>
  );
}
