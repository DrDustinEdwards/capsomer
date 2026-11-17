import { type ReactNode } from "react";
export interface DisclosureProps {
    summary: ReactNode;
    children: ReactNode;
    name?: string;
    defaultOpen?: boolean;
    variant?: "accordion" | "card" | "inline";
    size?: "sm";
    marker?: "sign" | "triangle";
    print?: "hide";
    className?: string;
}
export declare function Disclosure({ summary, children, name, defaultOpen, variant, size, marker, print, className, }: DisclosureProps): import("react").JSX.Element;
export interface GroupProps {
    label: string;
    count: number;
    children: ReactNode;
    defaultExpanded?: boolean;
    holdsCritical?: boolean;
    headingLevel?: 2 | 3 | 4;
}
export declare function Group({ label, count, children, defaultExpanded, holdsCritical, headingLevel, }: GroupProps): import("react").JSX.Element;
export declare function useExpand(defaultOpen?: boolean): {
    open: boolean;
    setOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    toggle: {
        "aria-expanded": boolean;
        "aria-controls": string;
        onClick: () => void;
    };
    region: {
        id: string;
    };
};
export interface ExpandToggleProps {
    label: ReactNode;
    openLabel?: ReactNode;
    open: boolean;
    onToggle: () => void;
    controls: string;
    className?: string;
}
export declare function ExpandToggle({ label, openLabel, open, onToggle, controls, className, }: ExpandToggleProps): import("react").JSX.Element;
export interface ExpandRowsProps {
    row: (toggle: ReactNode) => ReactNode;
    name: ReactNode;
    toggleSuffix?: string;
    detail: ReactNode;
    columns: number;
    defaultOpen?: boolean;
}
export declare function ExpandRows({ row, name, toggleSuffix, detail, columns, defaultOpen, }: ExpandRowsProps): import("react").JSX.Element;
