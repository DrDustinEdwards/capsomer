import { Link } from "../link/link.react.tsx";

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
