import type { ReactNode } from "react";
import { type DocumentScope } from "./document.ts";
export { routeHydrates } from "@dustinedwards/site-runtime/deferred-scripts";
export { documentAttrs, startSite, type DocumentScope, type Starter } from "./document.ts";
export interface DocumentProps extends DocumentScope {
    children: ReactNode;
    lang?: string;
    head?: ReactNode;
    hydrate?: boolean;
    script?: string;
    end?: ReactNode;
}
export declare function Document({ children, lang, head, hydrate, script, end, ...scope }: DocumentProps): import("react").JSX.Element;
export interface SiteScopeProps extends DocumentScope {
    children: ReactNode;
    as?: "div" | "section" | "main" | "article";
    className?: string;
}
export declare function SiteScope({ children, as: Tag, className, ...scope }: SiteScopeProps): import("react").JSX.Element;
