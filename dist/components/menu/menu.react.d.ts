import { type ReactNode } from "react";
export interface MenuAction {
    type?: "item";
    label: string;
    onSelect?: () => void;
    danger?: boolean;
    disabled?: boolean;
    reason?: string;
    shortcut?: string;
    icon?: ReactNode;
}
export interface MenuCheckbox {
    type: "checkbox";
    label: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    shortcut?: string;
}
export interface MenuRadioGroup {
    type: "radio-group";
    label?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    items: Array<{
        value: string;
        label: string;
        disabled?: boolean;
    }>;
}
export interface MenuGroup {
    type: "group";
    label: string;
    items: MenuAction[];
}
export interface MenuSubmenu {
    type: "submenu";
    label: string;
    items: MenuEntry[];
    disabled?: boolean;
    icon?: ReactNode;
}
export type MenuEntry = MenuAction | MenuCheckbox | MenuRadioGroup | MenuGroup | MenuSubmenu | "separator";
export interface MenuProps {
    label: ReactNode;
    "aria-label"?: string;
    items: MenuEntry[];
    disabled?: boolean;
    container?: HTMLElement | null;
    defaultOpen?: boolean;
}
export declare function arrangeEntries(items: MenuEntry[]): MenuEntry[];
export declare function Menu({ label, items, disabled, container, defaultOpen, ...rest }: MenuProps): import("react").JSX.Element;
export interface FormMenuItem {
    label: string;
    value: string;
    href?: string;
    danger?: boolean;
    disabled?: boolean;
    reason?: string;
    onSelect?: () => void;
}
export interface FormMenuProps {
    label: ReactNode;
    "aria-label"?: string;
    action: string;
    method?: "post" | "get";
    items: FormMenuItem[];
    name?: string;
    hidden?: Record<string, string>;
}
export declare function FormMenu({ label, action, method, items, name, hidden, ...rest }: FormMenuProps): import("react").JSX.Element;
