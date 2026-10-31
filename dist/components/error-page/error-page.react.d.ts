import type { ReactNode } from "react";
export interface ErrorWords {
    status: number;
    title: string;
    text: string;
}
/** What the page says for an error: its status, a title and one plain sentence. */
export declare function errorWords(error: unknown): ErrorWords;
/** The title for the root `meta` on the error path: "Page not found | Site name". */
export declare function errorTitle(error: unknown, siteName: string): string;
export interface ErrorPageProps {
    error: unknown;
    home: string;
    siteHeader?: ReactNode;
    siteFooter?: ReactNode;
    children?: ReactNode;
    dev?: boolean;
    mainId?: string;
    className?: string;
    title?: string;
    text?: string;
    homeLabel?: string;
    as?: "main" | "div";
}
export declare function ErrorPage({ error, home, siteHeader, siteFooter, children, dev, mainId, className, title, text, homeLabel, as: Region, }: ErrorPageProps): import("react").JSX.Element;
