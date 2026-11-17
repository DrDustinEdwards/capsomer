import { useEffect, type ReactNode } from "react";
export { cn } from "./hooks.ts";
export declare const useIsoLayoutEffect: typeof useEffect;
/** React's useId with only letters and digits, safe in an id, a selector and an anchor (React's own has colons). */
export declare function useCleanId(): string;
/** False on the server and in the render that hydrates; true after, and at once for a part first drawn in the browser. */
export declare function useHydrated(): boolean;
/** `fallback` on the server and while hydrating, then `children` (in Suspense, for a lazy import). For window-only libraries; the fallback is the accessible text equivalent. */
export declare function ClientOnly({ children, fallback }: {
    children: ReactNode;
    fallback: ReactNode;
}): import("react").JSX.Element;
/** Whether a media query matches; `serverValue` (false) on the server and while hydrating. */
export declare function useMedia(query: string, serverValue?: boolean): boolean;
/** True when the reader asked for less motion. A script-driven motion checks it; CSS motion sits in its own media query. */
export declare function usePrefersReducedMotion(): boolean;
/** The browser's time zone once hydrated; `fallback` (the server's) until then. */
export declare function useBrowserZone<T extends string | null>(fallback: T): string | T;
/**
 * A value remembered in this browser under `key` (null on the server, while hydrating, or when none
 * is kept) and its setter (null forgets it). Every reader of the key on the page, and in other tabs,
 * follows a change. Where storage is refused it is kept for this page only.
 */
export declare function useRemembered(key: string): [string | null, (value: string | null) => void];
/**
 * The time now, in milliseconds, ticking every `ms` (30 s) once the page is live; 0 on the server
 * and while hydrating, so a time measured against it says the same words in both renders. Pass the
 * server's own read time as `serverNow` to draw against it until the clock starts.
 */
export declare function useNow(ms?: number, serverNow?: number): number;
/**
 * A result shown for `ms` after it arrives, then gone: "Saved", "Copied", a bulk action's count.
 * Returns the result while it shows (undefined after) and a function that hides it now (a close
 * button). A new result (another object) shows again. `clears` picks the results that go on their
 * own; the rest (a failure, usually) stay until hidden or replaced. The hook remembers the one it
 * hid, so a re-render does not bring it back.
 */
export declare function useShownFor<T>(result: T | null | undefined, ms: number, clears?: (result: T) => boolean): [shown: T | undefined, hide: () => void];
