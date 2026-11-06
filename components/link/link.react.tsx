import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { Link as RouterLink, NavLink as RouterNavLink, useHref, useLocation, type PrefetchBehavior, type To } from "react-router";
import { ABSOLUTE, mayPrefetch } from "./link.ts";

// React Router's Link and NavLink, the same props, prefetching on hover and focus by default
// (`prefetch="intent"`, which React Router has no app-wide setting for). A link mayPrefetch
// refuses (link.ts) renders with prefetch="none" whatever it asked for; `prefetch` picks the
// mode for the rest ("none", "render", "viewport").

const Exclude = createContext<readonly string[]>([]);

// The app's own paths that act on a GET, for every Link and NavLink under it, beyond the
// family's NEVER_PREFETCH: `<LinkPrefetch exclude={["/demos/:product"]}>` at the root.
export function LinkPrefetch({ exclude, children }: { exclude: readonly string[]; children?: ReactNode }) {
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

function usePrefetch({ to, relative, reloadDocument, target, download, prefetch = "intent" }: Asked): PrefetchBehavior {
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
