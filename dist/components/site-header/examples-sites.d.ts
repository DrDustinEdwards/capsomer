import { type AdminEntry, type AdminShellProps } from "../admin-shell/admin-shell.react.tsx";
import { type SiteHeaderProps } from "./site-header.react.tsx";
export declare const icon: (d: string, cls?: string) => import("react").JSX.Element;
export declare const hd: (d: string) => import("react").JSX.Element;
export declare const D: {
    grid: string;
    list: string;
    stack: string;
    share: string;
    clock: string;
    gauge: string;
    store: string;
    people: string;
    hook: string;
    brake: string;
    book: string;
    star: string;
    pen: string;
    bell: string;
    search: string;
    home: string;
};
export declare const Hero: ({ title, lead }: {
    title: string;
    lead: string;
}) => import("react").JSX.Element;
export declare const Tiles: ({ tiles, rows, }: {
    tiles: Array<[string, string, string]>;
    rows: Array<[string, string]>;
}) => import("react").JSX.Element;
export declare const fhPublic: SiteHeaderProps;
export declare const fhDashboard: AdminShellProps;
export declare const ownerBase: (app: "foxhound" | "foxing" | "portal", nav: AdminEntry[]) => AdminShellProps;
export declare const fhAdmin: AdminShellProps;
export declare const FH_TILES: Array<[string, string, string]>;
export declare const FH_ROWS: Array<[string, string]>;
export declare const FX_TILES: Array<[string, string, string]>;
export declare const FX_ROWS: Array<[string, string]>;
