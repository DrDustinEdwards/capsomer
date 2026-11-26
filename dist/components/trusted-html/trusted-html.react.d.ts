import type { HTMLAttributes, ReactNode } from "react";
export type RichTextTag = "div" | "span" | "p" | "section" | "article" | "blockquote" | "h1" | "h2" | "h3" | "h4" | "li" | "td" | "dd";
export interface RichTextProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML" | "style"> {
    html: string | null | undefined;
    as?: RichTextTag;
    measure?: boolean;
    fallback?: ReactNode;
}
/**
 * Stored, already sanitized HTML as an element's children, through the `capsomer` Trusted Types policy.
 * `markup()` hands React the same TrustedHTML object for the same string, so a re-render does not set it again.
 */
export declare function RichText({ html, as: Tag, measure, fallback, className, ...rest }: RichTextProps): import("react").JSX.Element;
