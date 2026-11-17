import type { ReactNode } from "react";
import type { PatchOptions } from "../manual/manual.ts";
import { type BreadcrumbItem, type BreadcrumbProps } from "../breadcrumb/breadcrumb.react.tsx";
export interface PageHeadProps {
    crumbs?: BreadcrumbItem[];
    renderLink?: BreadcrumbProps["renderLink"];
    title: ReactNode;
    lead?: ReactNode;
    actions?: ReactNode;
    headingLevel?: "h1" | "h2" | "h3";
    patch?: PatchOptions;
}
export declare function PageHead({ crumbs, renderLink, title, lead, actions, headingLevel: H, patch, }: PageHeadProps): import("react").JSX.Element;
