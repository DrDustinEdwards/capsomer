import type { HTMLAttributes, ReactNode } from "react";
/** The elements stored HTML is rendered into: a block, an inline run (a title), or a heading or cell that holds it. */
export type RichTextTag = "div" | "span" | "p" | "section" | "article" | "blockquote" | "h1" | "h2" | "h3" | "h4" | "li" | "td" | "dd";
export interface RichTextProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML" | "style"> {
    html: string | null | undefined;
    as?: RichTextTag;
    measure?: boolean;
    fallback?: ReactNode;
}
/**
 * Stored, already sanitized HTML as an element's children, through the `capsomer` Trusted Types policy.
 * React sets it with `innerHTML` in the browser; `markup()` hands it TrustedHTML, and the same object
 * for the same string, so a re-render does not set it again. No `style` is rendered (style-src 'self').
 */
export declare function RichText({ html, as: Tag, measure, fallback, className, ...rest }: RichTextProps): import("react").JSX.Element;
