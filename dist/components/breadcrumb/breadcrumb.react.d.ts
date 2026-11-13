import type { ReactNode } from "react";
export interface BreadcrumbItem {
    label: string;
    href?: string;
}
export interface BreadcrumbProps {
    items: BreadcrumbItem[];
    maxItems?: number;
    minItems?: number;
    label?: string;
    renderLink?: (props: {
        href: string;
        className: string;
        children: ReactNode;
    }) => ReactNode;
}
export declare function Breadcrumb({ items, maxItems, minItems, label, renderLink, }: BreadcrumbProps): import("react").JSX.Element | null;
