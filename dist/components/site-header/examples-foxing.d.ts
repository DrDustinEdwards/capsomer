import { type AdminShellProps } from "../admin-shell/admin-shell.react.tsx";
import { type SiteHeaderProps } from "./site-header.react.tsx";
export declare const fxPublic: SiteHeaderProps;
export declare const fxReader: SiteHeaderProps;
export declare const fxTabs: ({
    label: string;
    href: string;
    icon: import("react").JSX.Element;
    current: boolean;
} | {
    label: string;
    href: string;
    icon: import("react").JSX.Element;
    current?: undefined;
})[];
export declare const fxAdmin: AdminShellProps;
