import { type ReactNode } from "react";
export interface DisclosureProps {
    summary: ReactNode;
    children: ReactNode;
    name?: string;
    defaultOpen?: boolean;
    variant?: "accordion";
}
export declare function Disclosure({ summary, children, name, defaultOpen, variant }: DisclosureProps): import("react").JSX.Element;
export interface GroupProps {
    label: string;
    count: number;
    children: ReactNode;
    defaultExpanded?: boolean;
    holdsCritical?: boolean;
    headingLevel?: 2 | 3 | 4;
}
export declare function Group({ label, count, children, defaultExpanded, holdsCritical, headingLevel }: GroupProps): import("react").JSX.Element;
