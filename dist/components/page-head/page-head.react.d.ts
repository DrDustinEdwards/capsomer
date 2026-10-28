import type { ReactNode } from "react";
import { type BreadcrumbItem, type BreadcrumbProps } from "../breadcrumb/breadcrumb.react.tsx";
export interface PageHeadProps {
    crumbs?: BreadcrumbItem[];
    renderLink?: BreadcrumbProps["renderLink"];
    title: ReactNode;
    lead?: ReactNode;
    actions?: ReactNode;
}
export declare function PageHead({ crumbs, renderLink, title, lead, actions }: PageHeadProps): import("react").JSX.Element;
