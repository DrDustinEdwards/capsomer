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
