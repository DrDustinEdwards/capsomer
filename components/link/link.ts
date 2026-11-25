// Whether a router link may prefetch its page on hover and focus, the rule behind capsomer/react/link.
// A hydrated React Router app prefetches with its own `prefetch="intent"`, not the speculation rules
// that script-less sites use (site-runtime ./prefetch), which would fetch HTML the app never reads.
// A prefetch runs the target's loader, so the paths those rules never prefetch are never prefetched
// here: `NEVER_PREFETCH` and `FILE_EXTENSIONS` come from site-runtime, not a copy.
import { FILE_EXTENSIONS, NEVER_PREFETCH } from "@dustinedwards/site-runtime/prefetch";

export interface PrefetchLink {
  href: string;
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

// True when `path` is `pattern` or under it, segment by segment, ignoring case. A segment ":name" or
// "*" stands for any one segment: underPath("/administer", "/admin") is false.
export function underPath(path: string, pattern: string): boolean {
  const want = segments(pattern);
  const have = segments(path);
  return (
    want.length <= have.length &&
    want.every((w, i) => w === have[i] || w === "*" || w.startsWith(":"))
  );
}

// Never for a link that loads a whole document, opens elsewhere, downloads, leaves the app, points
// at a file, or goes under NEVER_PREFETCH or `exclude`; /admin only from a page already under /admin.
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
