// capsomer/behavior/link: whether a router link may prefetch its page on hover and focus, the
// rule behind capsomer/react/link.
//
// A hydrated React Router app navigates on the client, so it prefetches with React Router's own
// `prefetch="intent"` (the route's modules and loader data), not the speculation rules the sites
// without script use (site-runtime ./prefetch), which would fetch HTML the app never reads. A
// prefetch runs the target's loader, so the paths those rules never prefetch are never prefetched
// here either: `NEVER_PREFETCH` and `FILE_EXTENSIONS` come from site-runtime, not a copy.
import { FILE_EXTENSIONS, NEVER_PREFETCH } from "@dustinedwards/site-runtime/prefetch";

export interface PrefetchLink {
  // Where the link goes, as the router resolves it (useHref): a path from the origin with any
  // search and hash, or the absolute address of a link that leaves the app.
  href: string;
  // The path of the page the link is on.
  from: string;
  // The app's own paths that act on a GET, beyond NEVER_PREFETCH: patterns as in `underPath`.
  exclude?: readonly string[];
  reloadDocument?: boolean;
  target?: string;
  download?: unknown;
}

// The signed-in area NEVER_PREFETCH names. A page inside it may prefetch its own pages (their
// loaders only read); a public page never does.
const ADMIN = "/admin";

// An address with a scheme (https:, mailto:) or a protocol-relative one: not a route of this app.
export const ABSOLUTE = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

function segments(path: string): string[] {
  return path
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s).toLowerCase();
      } catch {
        return s.toLowerCase();
      }
    });
}

// True when `path` is `pattern` or sits under it, segment by segment and ignoring case, as the
// router matches. A pattern segment ":name" or "*" stands for any one segment:
// underPath("/b/handbook/export/epub", "/b/:project/export") is true, underPath("/administer", "/admin") false.
export function underPath(path: string, pattern: string): boolean {
  const want = segments(pattern);
  const have = segments(path);
  return want.length <= have.length && want.every((w, i) => w === have[i] || w === "*" || w.startsWith(":"));
}

// Whether the link may prefetch. Never for a link that loads a whole document (reloadDocument),
// opens elsewhere (a target other than _self), downloads, leaves the app, points at a file, or
// goes under NEVER_PREFETCH or the app's `exclude`; /admin only from a page already under /admin.
export function mayPrefetch(link: PrefetchLink): boolean {
  if (link.reloadDocument) return false;
  if (link.download !== undefined && link.download !== false) return false;
  if (link.target && link.target !== "_self") return false;
  if (ABSOLUTE.test(link.href)) return false;
  const path = link.href.replace(/[?#].*$/s, "");
  const lower = path.toLowerCase();
  if (FILE_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`))) return false;
  for (const prefix of NEVER_PREFETCH) {
    if (underPath(path, prefix) && !(prefix === ADMIN && underPath(link.from, ADMIN))) return false;
  }
  return !(link.exclude ?? []).some((pattern) => underPath(path, pattern));
}
