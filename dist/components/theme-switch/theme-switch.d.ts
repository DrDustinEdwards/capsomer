export type ThemeChoice = "light" | "dark";
export declare const THEME_PREF = "cap-theme";
export declare function readTheme(key?: string): ThemeChoice | null;
export declare function applyTheme(choice: ThemeChoice, opts?: {
    key?: string;
    remember?: boolean;
}): void;
export declare function applyStoredTheme(key?: string): ThemeChoice | null;
export declare function effectiveTheme(): ThemeChoice;
export declare function toggleTheme(key?: string): ThemeChoice;
export declare function themeButtonLabel(showing: ThemeChoice): string;
export declare function syncThemeButton(button: HTMLElement, showing?: ThemeChoice): void;
export declare function enhance(root?: ParentNode): () => void;
