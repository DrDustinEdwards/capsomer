import { type ReactNode } from "react";
interface Base {
    children?: ReactNode;
    className?: string;
    id?: string;
}
export interface TitleProps extends Base {
    size?: 1 | 2 | 3 | 4 | 5 | 6;
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div";
}
export interface TextProps extends Base {
    size?: "tiny" | "small" | "lead";
    tone?: "muted" | "dim" | "ink" | "accent" | "ok" | "crit";
    weight?: "strong";
    face?: "ui" | "mono" | "prose" | "display";
    align?: "center" | "end";
    as?: "p" | "span" | "div" | "li" | "dd" | "dt" | "small" | "strong" | "em";
}
export declare function Title({ size, as, className, ...rest }: TitleProps): import("react").DetailedReactHTMLElement<{
    className: string;
    "data-size": 1 | 3 | 2 | 6 | 5 | undefined;
    children?: ReactNode;
    id?: string;
}, HTMLElement>;
export declare function Text({ size, tone, weight, face, align, as, className, ...rest }: TextProps): import("react").DetailedReactHTMLElement<{
    className: string;
    "data-size": "small" | "lead" | "tiny" | undefined;
    "data-tone": "ok" | "crit" | "muted" | "accent" | "ink" | "dim" | undefined;
    "data-weight": "strong" | undefined;
    "data-face": "mono" | "display" | "prose" | "ui" | undefined;
    "data-align": "center" | "end" | undefined;
    children?: ReactNode;
    id?: string;
}, HTMLElement>;
export {};
