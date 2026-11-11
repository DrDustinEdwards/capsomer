export { badgeText } from "../site-header/site-header.ts";
export declare const ADMIN_PREF = "cap-rail";
export declare function pageTransitionsOn(shell?: HTMLElement | null): boolean;
export declare function startPageTransition(update: () => void | Promise<void>, shell?: HTMLElement | null): Promise<void>;
export declare function setMenu(shell: HTMLElement, collapsed: boolean, remember?: boolean): void;
export declare function toggleMenu(shell: HTMLElement): void;
export declare const JUMP_WINDOW_MS = 1200;
export declare function jumpTarget(armed: {
    at: number;
}, e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "target">, apps: ReadonlyArray<{
    href: string;
    current?: boolean;
}>, now?: number): string | null;
export declare function enhance(root?: ParentNode): () => void;
