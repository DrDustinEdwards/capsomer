import { type ThemeChoice } from "./theme-switch.ts";
export interface ThemeSwitchProps {
    prefKey?: string;
    legend?: string;
    initial?: ThemeChoice;
}
export declare function ThemeSwitch({ prefKey, legend, initial }: ThemeSwitchProps): import("react").JSX.Element;
export interface ThemeButtonProps {
    prefKey?: string;
    shortcut?: string;
    className?: string;
    initial?: ThemeChoice;
}
export declare function ThemeButton({ prefKey, shortcut, className, initial }: ThemeButtonProps): import("react").JSX.Element;
export interface ThemeFormProps {
    action?: string;
    cookie?: string;
    className?: string;
    shortcut?: string;
    prefKey?: string;
}
export declare function ThemeForm({ action, cookie, className, shortcut, prefKey }: ThemeFormProps): import("react").JSX.Element;
