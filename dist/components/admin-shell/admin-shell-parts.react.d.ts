import { type FamilyAppId } from "./apps.tsx";
import type { AdminApp, AdminShellProps } from "./admin-shell-types.ts";
export declare const Icon: ({ d }: {
    d: string;
}) => import("react").JSX.Element;
export declare const HeaderIcon: ({ d }: {
    d: string;
}) => import("react").JSX.Element;
export declare const COLLAPSE_D = "M3 4h18v16H3zM9 4v16M16 10l-2 2 2 2";
export declare const EXPAND_D = "M3 4h18v16H3zM9 4v16M14 10l2 2-2 2";
export declare const SEARCH_D = "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM21 21l-5-5";
export declare const INBOX_D = "M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6z";
export declare const REFRESH_D = "M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5";
export declare const countName: (label: string, count?: number, note?: string) => string | undefined;
export declare function Tip({ text, keys, side, offset, describe, }: {
    text: string;
    keys?: string;
    side?: "right" | "bottom";
    offset?: number;
    describe?: boolean;
}): import("react").JSX.Element;
export declare function stripApps(app: FamilyAppId | undefined, badges: AdminShellProps["badges"], apps: AdminApp[] | undefined): AdminApp[];
export declare const Badge: ({ count }: {
    count?: number;
}) => import("react").JSX.Element | null;
export declare const mark: (a: AdminApp) => string | number | bigint | boolean | Iterable<import("react").ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined> | import("react").JSX.Element;
