import { type ReactNode } from "react";
import type { BreadcrumbItem, BreadcrumbProps } from "../breadcrumb/breadcrumb.react.tsx";
export declare function SettingsRow({ label, help, children, }: {
    label: ReactNode;
    help?: ReactNode;
    children: (ids: {
        labelId: string;
        helpId?: string;
    }) => ReactNode;
}): import("react").JSX.Element;
export interface SwitchRowProps {
    name?: string;
    label: ReactNode;
    help?: ReactNode;
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    busy?: boolean;
    form?: string;
    submitOnChange?: boolean;
    saveLabel?: string;
    disabledReason?: ReactNode;
}
export declare function SwitchRow({ name, label, help, checked, defaultChecked, onCheckedChange, busy, form, submitOnChange, saveLabel, disabledReason, }: SwitchRowProps): import("react").JSX.Element;
export declare function SettingsLayout({ title, lead, crumbs, renderLink, back, actions, children, }: {
    title: ReactNode;
    lead?: ReactNode;
    crumbs?: BreadcrumbItem[];
    renderLink?: BreadcrumbProps["renderLink"];
    back?: {
        href: string;
        label: string;
    } | null;
    actions?: ReactNode;
    children?: ReactNode;
}): import("react").JSX.Element;
