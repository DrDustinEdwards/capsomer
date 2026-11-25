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
import { buttonAttrs, type ButtonLook } from "../button/button-look.ts";
import { ABSOLUTE, mayPrefetch } from "./link.ts";

// React Router's Link and NavLink, prefetching on hover and focus by default (React Router has no
// app-wide setting for `prefetch="intent"`). A link mayPrefetch refuses (link.ts) gets prefetch="none".

const Exclude = createContext<readonly string[]>([]);

// The app's own paths that act on a GET, beyond NEVER_PREFETCH: `<LinkPrefetch exclude={["/demos/:product"]}>` at the root.
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

// The renderLink every Capsomer part takes, as React Router's Link with prefetch on intent: pass it
// as is (`<SiteHeader renderLink={routerRenderLink} />`) instead of an adapter per site.
export function routerRenderLink({
  href,
  children,
  ...rest
}: { href: string; children?: ReactNode } & Omit<ComponentProps<typeof RouterLink>, "to">) {
  return (
    <Link to={href} {...rest}>
      {children}
    </Link>
  );
}

// A link to another site (the `away` kind): ↗ after the words, and the words a screen reader needs
// inside the link. `newTab` says so; `sponsored` sets rel="sponsored". Both keep noopener and noreferrer.
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

export const NEW_TAB_WORDS = " (opens in a new tab)";

export function AwayLink({ newTab = false, sponsored = false, children, ...rest }: AwayLinkProps) {
  return (
    <a {...rest} data-link="away" rel={awayRel(sponsored)} target={newTab ? "_blank" : undefined}>
      {children}
      <span className="cap-sr-only">{awayWords(newTab)}</span>
    </a>
  );
}

// A link drawn as a button (`a.cap-btn`): `to` is a route (prefetching as Link does); `href` is a plain
// document link (a download, an export, another site). `away` adds ↗ as AwayLink does.
type ButtonLinkLook = ButtonLook & {
  label?: string;
  away?: boolean;
  newTab?: boolean;
  sponsored?: boolean;
};

export type ButtonLinkProps = ButtonLinkLook &
  (
    | (Omit<ComponentProps<typeof RouterLink>, "style"> & { href?: never })
    | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "style"> & { href: string; to?: never })
  );

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
  const attrs = buttonAttrs(
    { variant, size, iconOnly, wrap, block, label, "aria-label": rest["aria-label"] },
    className,
  );
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
      <a {...anchor} {...attrs} target={target ?? anchor.target} rel={rel ?? anchor.rel}>
        {body}
      </a>
    );
  }
  const link = rest as ComponentProps<typeof RouterLink>;
  return (
    <Link {...link} {...attrs} target={target ?? link.target} rel={rel ?? link.rel}>
      {body}
    </Link>
  );
}
