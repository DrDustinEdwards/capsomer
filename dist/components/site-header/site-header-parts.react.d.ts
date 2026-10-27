import { type ReactNode } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
export interface HeaderLink {
    id?: string;
    label: string;
    href: string;
    current?: boolean;
    icon?: ReactNode;
    count?: number;
    countNote?: string;
}
export interface HeaderGroup {
    label?: string;
    links: HeaderLink[];
}
export interface HeaderLogo {
    href: string;
    label: string;
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
}
export interface HeaderSection {
    id: string;
    label: string;
    href?: string;
    current?: boolean;
    groups?: HeaderGroup[];
    panel?: ReactNode;
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
}
export interface HeaderAccountLink {
    label: string;
    href?: string;
    onClick?: () => void;
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
    };
    trail?: {
        crumbs: Array<{
            label: string;
            href?: string;
            current?: boolean;
        }>;
        viewSite?: string;
    };
    band?: "dark";
    translucent?: boolean;
    sticky?: boolean;
    skipTo?: string;
    sheetStart?: SheetPart;
    sheetEnd?: SheetPart;
    sheetTitle?: string;
    renderLink?: (props: LinkProps) => ReactNode;
}
export declare const plainLink: ({ children, ...props }: LinkProps) => import("react").JSX.Element;
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
export declare function Disclosure({ id, className, label, name, current, align, children, button }: {
    id: string;
    className: string;
    label?: string;
    name?: string;
    current?: boolean;
    align?: "end";
    children: ReactNode;
    button: ReactNode;
}): import("react").JSX.Element;
export declare function GroupList({ groups, renderLink }: {
    groups: HeaderGroup[];
    renderLink: (p: LinkProps) => ReactNode;
}): import("react").JSX.Element;
export declare function SheetGroup({ label, links, renderLink, onClose }: {
    label?: string;
    links: HeaderLink[];
    renderLink?: (p: LinkProps) => ReactNode;
    onClose: () => void;
}): import("react").JSX.Element;
export declare const part: (p: SheetPart, close: () => void) => ReactNode;
