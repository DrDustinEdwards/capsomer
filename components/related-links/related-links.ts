// The pure half of related links: the one href check a stranger's link passes, and the date line.

import { formatDate, toMs } from "../time/time.ts";

// An http(s) address re-parsed, or null. A mention's addresses were chosen by a stranger, so
// anything else (javascript:, data:, a relative path) is never a link.
export function httpHref(value: string | null | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
}

// A path on this site ("/writing/getting-started"), not a protocol-relative "//host" address.
export function sitePath(value: string | null | undefined): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");
}

// "September 5, 2026" and its ISO form, in UTC so the server and the browser agree; null for a
// value that is not a date.
export function longDate(
  value: string | number | Date | null | undefined,
): { text: string; iso: string } | null {
  const text = formatDate(value);
  return text === null ? null : { text, iso: new Date(toMs(value)).toISOString() };
}
