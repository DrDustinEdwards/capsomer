import { type ReactNode } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import type { ThemeChoice, ThemeSave } from "../theme-switch/theme-switch.ts";
import { type Suggest } from "./site-header.ts";
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
export declare const plainLink: ({ children, ...props }: LinkProps) => import("react").JSX.Element;
export declare const HeaderHydrates: import("react").Context<boolean>;
export declare function headerItem(item: {
    href?: string;
    current?: boolean;
    label: string;
} & HeaderDoes, children: ReactNode, renderLink: (p: LinkProps) => ReactNode, { onClose, ariaLabel, disabled, }?: {
    onClose?: () => void;
    ariaLabel?: string;
    disabled?: boolean;
}): ReactNode;
export declare const CHEV: import("react").JSX.Element;
export declare const MENU_ICON: import("react").JSX.Element;
export declare const SEARCH_ICON: import("react").JSX.Element;
export declare const PERSON_ICON: import("react").JSX.Element;
export declare const countName: (label: string, count?: number, note?: string) => string;
export declare function TipKeys({ keys }: {
    keys?: string;
}): import("react").JSX.Element | null;
export declare function HeaderTip({ text, keys }: {
    text: string;
    keys?: string;
}): import("react").JSX.Element;
export declare function Disclosure({ id, className, label, name, current, align, size, panelClassName, children, button, }: {
    id: string;
    className: string;
    label?: string;
    name?: string;
    current?: boolean;
    align?: "end";
    size?: "wide";
    panelClassName?: string;
    children: ReactNode;
    button: ReactNode;
}): import("react").JSX.Element;
export declare function GroupList({ groups, renderLink, }: {
    groups: HeaderGroup[];
    renderLink: (p: LinkProps) => ReactNode;
}): import("react").JSX.Element;
export declare function SheetGroup({ label, links, renderLink, onClose, }: {
    label?: string;
    links: HeaderItem[];
    renderLink?: (p: LinkProps) => ReactNode;
    onClose: () => void;
}): import("react").JSX.Element;
export declare const part: (p: SheetPart, close: () => void) => ReactNode;
