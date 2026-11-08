import { type InputHTMLAttributes, type ReactNode } from "react";
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "checked" | "defaultChecked" | "onChange" | "style"> {
    label: ReactNode;
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    onWord?: string;
    offWord?: string;
    busy?: boolean;
}
export declare function Switch(props: SwitchProps): import("react").JSX.Element;
