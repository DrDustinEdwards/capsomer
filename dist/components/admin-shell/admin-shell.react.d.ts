import { type ComponentPropsWithRef, type ReactNode } from "react";
import { type LinkProps } from "../shell/shell.react.tsx";
import { type HeaderExtra, type HeaderLogo, type HeaderSwitcher } from "../site-header/site-header.react.tsx";
import { FAMILY_APPS, FIRST_PAGE, FOXHOUND_MARKS, OWNER, type FamilyAppId } from "./apps.tsx";
export type { LinkProps, FamilyAppId, HeaderExtra, HeaderLogo, HeaderSwitcher };
export { startPageTransition } from "./admin-shell.ts";
export { FAMILY_APPS, FIRST_PAGE, FOXHOUND_MARKS, OWNER };
export interface AdminEntry {
    id: string;
    label: string;
    href: string;
    icon?: ReactNode;
    current?: boolean;
    count?: number;
    countNote?: string;
    tone?: "need" | "crit" | "warn";
    group?: string;
}
export interface AdminApp {
    id: string;
    label: string;
    href: string;
    logo?: ReactNode;
    mono?: string;
    current?: boolean;
    count?: number;
    countNote?: string;
}
export interface AdminAccountLink {
    label: string;
    href?: string;
    onClick?: () => void;
    current?: boolean;
}
export interface AdminBadge {
    count?: number;
    countNote?: string;
}
export interface AdminCrumb {
    label: string;
    href: string;
}
export interface AdminAccount {
    name?: string;
    initials?: string;
    avatar?: string;
    role?: string;
    email?: string;
    appLinks?: AdminAccountLink[];
    appLabel?: string;
    onSignOut?: () => void;
    signOutDisabled?: boolean;
}
export interface AdminShellProps {
    variant?: "owner" | "user";
    app?: FamilyAppId;
    badges?: Partial<Record<FamilyAppId, AdminBadge>>;
    title?: string;
    apps?: AdminApp[];
    nav: AdminEntry[];
    page?: string;
    trail?: AdminCrumb[];
    tabs?: AdminEntry[];
    navLabel?: string;
    logo?: HeaderLogo;
    band?: "dark";
    translucent?: boolean;
    switchers?: HeaderSwitcher[];
    extras?: HeaderExtra[];
    onSearch?: () => void;
    searchShortcut?: string;
    inbox?: {
        count?: number;
        countNote?: string;
        href?: string;
        onOpen?: () => void;
        shortcut?: string;
    };
    onHelp?: () => void;
    viewSite?: string;
    account?: AdminAccount;
    updated?: {
        at: number | Date | string;
        auto?: boolean;
    };
    status?: ReactNode;
    actions?: ReactNode;
    onRefresh?: () => void;
    refreshing?: boolean;
    refreshShortcut?: string;
    themePrefKey?: string;
    themeKey?: string;
    prefKey?: string;
    jumpKeys?: boolean;
    collapseKey?: string;
    renderLink?: (props: LinkProps) => ReactNode;
    mainProps?: Omit<ComponentPropsWithRef<"main">, "id" | "className" | "tabIndex" | "children">;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    transition?: boolean;
    children: ReactNode;
}
export declare function AdminShell(props: AdminShellProps): import("react").JSX.Element;
