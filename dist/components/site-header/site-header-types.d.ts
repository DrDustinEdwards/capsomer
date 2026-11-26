import type { ReactNode } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import type { ThemeChoice, ThemeSave } from "../theme-switch/theme-switch.ts";
import type { Suggest } from "./site-header.ts";
export interface HeaderLink {
    id?: string;
    label: string;
    href: string;
    current?: boolean;
    icon?: ReactNode;
    count?: number;
    countNote?: string;
}
export interface HeaderDoes {
    action?: string;
    method?: "post" | "get";
    fields?: Record<string, string>;
    onClick?: () => void;
}
export interface HeaderActionItem extends HeaderDoes {
    id?: string;
    label: string;
    href?: undefined;
    current?: boolean;
    icon?: ReactNode;
    count?: number;
    countNote?: string;
}
export type HeaderItem = HeaderLink | HeaderActionItem;
export interface HeaderGroup {
    label?: string;
    links: HeaderItem[];
}
export interface HeaderLogo {
    href: string;
    label: string;
    className?: string;
    name?: string;
    mark?: ReactNode;
    wordmark?: ReactNode;
    agency?: string;
    app?: string;
}
export interface HeaderSwitcher {
    id: string;
    label: string;
    name?: string;
    tile?: string;
    mark?: ReactNode;
    groups: HeaderGroup[];
    panel?: ReactNode;
    sheetLabel?: string;
    panelSize?: "wide";
    panelClassName?: string;
}
export interface HeaderSection {
    id: string;
    label: string;
    href?: string;
    current?: boolean;
    groups?: HeaderGroup[];
    panel?: ReactNode;
    panelSize?: "wide";
    panelClassName?: string;
}
export interface HeaderExtra {
    id: string;
    label: string;
    kind?: "icon" | "button";
    icon?: ReactNode;
    href?: string;
    onClick?: () => void;
    count?: number;
    countNote?: string;
    keys?: string;
    phone?: "bar";
    className?: string;
}
export interface HeaderAccountLink extends HeaderDoes {
    label: string;
    href?: string;
    current?: boolean;
}
export interface HeaderAccount {
    name: string;
    initials: string;
    avatar?: string;
    detail?: string;
    groups?: Array<{
        label?: string;
        links: HeaderAccountLink[];
    }>;
    signOutAction?: string;
    signOutFields?: Record<string, string>;
    onSignOut?: () => void;
    signOutHref?: string;
    signOutDisabled?: boolean;
    panel?: ReactNode;
}
export type SheetPart = ReactNode | ((close: () => void) => ReactNode);
export interface SiteHeaderProps {
    logo: HeaderLogo;
    switchers?: HeaderSwitcher[];
    sections?: HeaderSection[];
    links?: "left" | "center" | "right";
    extras?: HeaderExtra[];
    theme?: boolean;
    themePrefKey?: string;
    themeKey?: string;
    themeCookie?: string;
    onThemeSave?: ThemeSave;
    themeInitial?: ThemeChoice;
    themeAction?: string;
    account?: HeaderAccount;
    signIn?: {
        href: string;
        label?: string;
    };
    variant?: "letterhead";
    search?: {
        action: string;
        label: string;
        name?: string;
        suggest?: Suggest;
    };
    trail?: {
        crumbs: Array<{
            label: string;
            href?: string;
            current?: boolean;
        }>;
        viewSite?: string;
    };
    collapse?: "lg";
    sheetIcons?: "auto";
    menuIcon?: ReactNode;
    band?: "dark";
    translucent?: boolean;
    rest?: "clear";
    sticky?: boolean;
    skipTo?: string;
    sheetStart?: SheetPart;
    sheetEnd?: SheetPart;
    sheetTitle?: string;
    sheetLinksLabel?: string | null;
    navLabel?: string;
    hydrate?: boolean;
    renderLink?: (props: LinkProps) => ReactNode;
    attributes?: Record<`data-${string}`, string>;
    toolsEnd?: ReactNode;
    end?: ReactNode;
}
