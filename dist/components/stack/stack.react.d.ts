import { type ReactNode } from "react";
export interface StackProps {
    children?: ReactNode;
    gap?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    as?: "div" | "section" | "ul" | "ol" | "li" | "form" | "fieldset" | "article" | "header" | "footer";
    className?: string;
    id?: string;
}
export declare function Stack({ gap, as, className, ...rest }: StackProps): import("react").DetailedReactHTMLElement<{
    className: string;
    "data-gap": 1 | 3 | 2 | 4 | 8 | 6 | 5 | 7 | 9 | undefined;
    children?: ReactNode;
    id?: string;
}, HTMLElement>;
