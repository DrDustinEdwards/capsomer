import type { ReactNode } from "react";

// A figure's source, under it: "Source: stripe.com, read October 2026 ↗". Every statistic names
// where it came from and when it was read, as a link to that page.

// The name a source line shows for an address: its host, without "www.".
export function citation(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

export interface SourceLineProps {
  href: string;
  // When it was read: "October 2026".
  read: ReactNode;
  // The source's name. Default: the address's host.
  name?: ReactNode;
}

export function SourceLine({ href, read, name }: SourceLineProps) {
  return (
    <p className="cap-source-line">
      <a href={href} rel="noopener noreferrer">
        Source: {name ?? citation(href)}, read {read}
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
        </svg>
        <span className="cap-sr-only"> (opens the source)</span>
      </a>
    </p>
  );
}
