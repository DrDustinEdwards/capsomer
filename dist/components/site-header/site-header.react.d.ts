import { type ReactNode } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import { type HeaderLink, type SiteHeaderProps } from "./site-header-parts.react.tsx";
export { countName, HeaderTip, SheetGroup } from "./site-header-parts.react.tsx";
export type { HeaderLink, HeaderGroup, HeaderLogo, HeaderSwitcher, HeaderSection, HeaderExtra, HeaderAccountLink, HeaderAccount, SheetPart, SiteHeaderProps } from "./site-header-parts.react.tsx";
export type { LinkProps };
export declare function SiteHeader(props: SiteHeaderProps): import("react").JSX.Element;
export declare function SiteTabs({ tabs, label, renderLink }: {
    tabs: HeaderLink[];
    label?: string;
    renderLink?: (p: LinkProps) => ReactNode;
}): import("react").JSX.Element;
