import {
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  useHref,
  useLocation,
  type PrefetchBehavior,
  type To,
} from "react-router";
import { ABSOLUTE, mayPrefetch } from "./link.ts";

// React Router's Link and NavLink, the same props, prefetching on hover and focus by default
// (`prefetch="intent"`, which React Router has no app-wide setting for). A link mayPrefetch
// refuses (link.ts) renders with prefetch="none" whatever it asked for; `prefetch` picks the
// mode for the rest ("none", "render", "viewport").

const Exclude = createContext<readonly string[]>([]);

// The app's own paths that act on a GET, for every Link and NavLink under it, beyond the
// family's NEVER_PREFETCH: `<LinkPrefetch exclude={["/demos/:product"]}>` at the root.
export function LinkPrefetch({
  exclude,
  children,
}: {
  exclude: readonly string[];
  children?: ReactNode;
}) {
  return <Exclude value={exclude}>{children}</Exclude>;
}

interface Asked {
  to: To;
  relative?: "route" | "path";
  reloadDocument?: boolean;
  target?: string;
  download?: unknown;
  prefetch?: PrefetchBehavior;
}

function usePrefetch({
  to,
  relative,
  reloadDocument,
  target,
  download,
  prefetch = "intent",
}: Asked): PrefetchBehavior {
  const exclude = useContext(Exclude);
  const resolved = useHref(to, { relative });
  const from = useHref(useLocation().pathname);
  if (prefetch === "none") return "none";
  const href = typeof to === "string" && ABSOLUTE.test(to) ? to : resolved;
  return mayPrefetch({ href, from, exclude, reloadDocument, target, download }) ? prefetch : "none";
}

export function Link(props: ComponentProps<typeof RouterLink>) {
  return <RouterLink {...props} prefetch={usePrefetch(props)} />;
}

export function NavLink(props: ComponentProps<typeof RouterNavLink>) {
  return <RouterNavLink {...props} prefetch={usePrefetch(props)} />;
}

// A link to another site (the `away` kind, link.md): ↗ after the words, and the words a screen
// reader needs inside the link. `newTab` opens it in a new tab and says so; `sponsored` marks a
// paid or affiliate link (rel="sponsored"). Both keep noopener and noreferrer.
export interface AwayLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "rel" | "target" | "style"
> {
  href: string;
  newTab?: boolean;
  sponsored?: boolean;
  children?: ReactNode;
}

export function awayRel(sponsored = false): string {
  return sponsored ? "external sponsored noopener noreferrer" : "external noopener noreferrer";
}

export function awayWords(newTab = false): string {
  return newTab ? " (opens another site in a new tab)" : " (opens another site)";
}

// The words for a link on this site that opens in a new tab.
export const NEW_TAB_WORDS = " (opens in a new tab)";

export function AwayLink({ newTab = false, sponsored = false, children, ...rest }: AwayLinkProps) {
  return (
    <a {...rest} data-link="away" rel={awayRel(sponsored)} target={newTab ? "_blank" : undefined}>
      {children}
      <span className="cap-sr-only">{awayWords(newTab)}</span>
    </a>
  );
}

// A link drawn as a button (`a.cap-btn`, button.md): the Button's variant, size, icon, wrap and
// block, for moving to another view. `to` is a route (React Router's Link, prefetching as Link
// does); `href` is a plain document link (a download, an export, another site). `away` marks a
// link to another site, as AwayLink does, with ↗ after the words.
type ButtonLook = {
  variant?: "default" | "primary" | "secondary" | "danger" | "quiet" | "link";
  size?: "xs" | "sm" | "default" | "lg";
  iconOnly?: boolean;
  label?: string;
  wrap?: boolean;
  block?: boolean;
  away?: boolean;
  newTab?: boolean;
  sponsored?: boolean;
};

export type ButtonLinkProps = ButtonLook &
  (
    | (Omit<ComponentProps<typeof RouterLink>, "style"> & { href?: never })
    | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "style"> & { href: string; to?: never })
  );

function buttonAttrs(look: ButtonLook, className: string | undefined) {
  const {
    variant = "default",
    size = "default",
    iconOnly = false,
    wrap = false,
    block = false,
  } = look;
  return {
    className: className ? `cap-btn ${className}` : "cap-btn",
    "data-variant": variant === "default" ? undefined : variant,
    "data-size": size === "default" ? undefined : size,
    "data-icon-only": iconOnly ? "" : undefined,
    "data-wrap": wrap ? "" : undefined,
    "data-block": block ? "" : undefined,
  };
}

export function ButtonLink(props: ButtonLinkProps) {
  const {
    variant,
    size,
    iconOnly,
    label,
    wrap,
    block,
    away = false,
    newTab = false,
    sponsored = false,
    className,
    children,
    ...rest
  } = props;
  const attrs = buttonAttrs({ variant, size, iconOnly, wrap, block }, className);
  if (iconOnly && !label && !rest["aria-label"])
    console.warn("ButtonLink: an icon-only link needs a label.");
  const name = iconOnly ? (label ?? rest["aria-label"]) : rest["aria-label"];
  const body = (
    <>
      {children}
      {away ? (
        <>
          <span className="cap-btn-away" aria-hidden="true">
            {"↗"}
          </span>
          <span className="cap-sr-only">{awayWords(newTab)}</span>
        </>
      ) : newTab ? (
        <span className="cap-sr-only">{NEW_TAB_WORDS}</span>
      ) : null}
    </>
  );
  const target = newTab ? "_blank" : undefined;
  const rel = away ? awayRel(sponsored) : newTab ? "noopener noreferrer" : undefined;
  if (typeof rest.href === "string") {
    const anchor = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        {...anchor}
        {...attrs}
        aria-label={name}
        target={target ?? anchor.target}
        rel={rel ?? anchor.rel}
      >
        {body}
      </a>
    );
  }
  const link = rest as ComponentProps<typeof RouterLink>;
  return (
    <Link
      {...link}
      {...attrs}
      aria-label={name}
      target={target ?? link.target}
      rel={rel ?? link.rel}
    >
      {body}
    </Link>
  );
}
