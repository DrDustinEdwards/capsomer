import type { HTMLAttributes, ReactNode } from "react";
import { markup } from "./trusted-html.ts";

export type RichTextTag =
  | "div"
  | "span"
  | "p"
  | "section"
  | "article"
  | "blockquote"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "li"
  | "td"
  | "dd";

export interface RichTextProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "dangerouslySetInnerHTML" | "style"
> {
  // HTML the server already sanitized for this origin (a stored abstract, a bio, a statement). Never a visitor's raw input.
  html: string | null | undefined;
  // The element it is rendered into. A div by default; a span for a title inside a line.
  as?: RichTextTag;
  // Keeps running text to the reading measure (`--measure`), in place of an inline max-width.
  measure?: boolean;
  // Shown in place of the element when `html` is empty: "Untitled", "No description yet".
  fallback?: ReactNode;
}

/**
 * Stored, already sanitized HTML as an element's children, through the `capsomer` Trusted Types policy.
 * `markup()` hands React the same TrustedHTML object for the same string, so a re-render does not set it again.
 */
export function RichText({
  html,
  as: Tag = "div",
  measure,
  fallback = null,
  className,
  ...rest
}: RichTextProps) {
  if (!html) return <>{fallback}</>;
  // A style that reached here past the types is dropped, never rendered.
  const { style: _style, ...attrs } = rest as typeof rest & { style?: unknown };
  return (
    <Tag
      {...attrs}
      className={className ? `cap-rich-text ${className}` : "cap-rich-text"}
      data-measure={measure ? "text" : undefined}
      dangerouslySetInnerHTML={markup(html)}
    />
  );
}
