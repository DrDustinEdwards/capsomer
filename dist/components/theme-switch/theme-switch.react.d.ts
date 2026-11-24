import { type ThemeChoice, type ThemeSave } from "./theme-switch.ts";
export type { ThemeChoice, ThemeSave };
export interface ThemeSwitchProps {
    prefKey?: string;
    legend?: string;
    initial?: ThemeChoice;
    cookie?: string;
    onSave?: ThemeSave;
    onError?: (error: unknown) => void;
}
export declare function ThemeSwitch({ prefKey, legend, initial, cookie, onSave, onError, }: ThemeSwitchProps): import("react").JSX.Element;
export interface ThemeButtonProps {
    prefKey?: string;
    shortcut?: string;
    className?: string;
    initial?: ThemeChoice;
    cookie?: string;
    onSave?: ThemeSave;
    onError?: (error: unknown) => void;
    hydrate?: boolean;
}
export declare function ThemeButton({ prefKey, shortcut, className, initial, cookie, onSave, onError, hydrate, }: ThemeButtonProps): import("react").JSX.Element;
export interface ThemeFormProps {
    action?: string;
    cookie?: string;
    className?: string;
    shortcut?: string;
    prefKey?: string;
}
export declare function ThemeForm({ action, cookie, className, shortcut, prefKey, }: ThemeFormProps): import("react").JSX.Element;
export interface ThemeColorProps {
    choice?: ThemeChoice | null;
    ground: {
        light: string;
        dark: string;
    };
}
export declare function ThemeColor({ choice, ground }: ThemeColorProps): import("react").JSX.Element;
