import type { ReactNode } from "react";
import { type BreadcrumbItem, type BreadcrumbProps } from "../breadcrumb/breadcrumb.react.tsx";
export interface PageHeadProps {
    crumbs?: BreadcrumbItem[];
    renderLink?: BreadcrumbProps["renderLink"];
    title: ReactNode;
    lead?: ReactNode;
    actions?: ReactNode;
    headingLevel?: "h1" | "h2" | "h3";
}
export declare function PageHead({ crumbs, renderLink, title, lead, actions, headingLevel: H }: PageHeadProps): import("react").JSX.Element;
