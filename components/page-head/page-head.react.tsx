import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps } from "../breadcrumb/breadcrumb.react.tsx";

export interface PageHeadProps {
  // Levels above this page, first to current. Fewer than two levels draws no trail (a hub).
  crumbs?: BreadcrumbItem[];
  // Draw a trail link with the app's router link; passed to the Breadcrumb.
  renderLink?: BreadcrumbProps["renderLink"];
  // The page's one h1.
  title: ReactNode;
  // One line saying what the page is for.
  lead?: ReactNode;
  // The page's actions, at the right (buttons and links).
  actions?: ReactNode;
  // The title's level: the page's one h1, or lower where the page already has one (a states
  // page's specimen, a view inside another page).
  headingLevel?: "h1" | "h2" | "h3";
}

// The HTML contract in page-head.md.
export function PageHead({ crumbs, renderLink, title, lead, actions, headingLevel: H = "h1" }: PageHeadProps) {
  return (
    <header className="cap-page-head">
      <div className="cap-page-head-text">
        {crumbs && crumbs.length > 1 ? <Breadcrumb items={crumbs} renderLink={renderLink} /> : null}
        <H className="cap-page-head-title">{title}</H>
        {lead ? <p className="cap-page-head-lead">{lead}</p> : null}
      </div>
      {actions ? <div className="cap-page-head-actions">{actions}</div> : null}
    </header>
  );
}
