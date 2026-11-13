import type { ReactNode } from "react";
import { markup } from "../trusted-html/trusted-html.ts";

export interface ProsePageHeadProps {
  title: ReactNode;
  lead?: ReactNode;
  // Something under the title in the band (a date, a button).
  headExtra?: ReactNode;
  // The id of the h1, for a link to the top.
  titleId?: string;
}

export interface ProsePageProps extends ProsePageHeadProps {
  children?: ReactNode;
  // The body as HTML the server already sanitized (a page stored as HTML), in place of children,
  // through the `capsomer` Trusted Types policy.
  html?: string;
}

// The title band alone, for a page whose body is not a prose column (an error page).
export function ProsePageHead({ title, lead, headExtra, titleId }: ProsePageHeadProps) {
  return (
    <header className="cap-prose-page-head">
      <h1 className="cap-prose-page-title" id={titleId}>
        {title}
      </h1>
      {lead ? <p className="cap-prose-page-lead">{lead}</p> : null}
      {headExtra}
    </header>
  );
}

// The HTML contract in prose-page.md: the title band, then one reading column in the prose context.
export function ProsePage({ children, html, ...head }: ProsePageProps) {
  return (
    <>
      <ProsePageHead {...head} />
      {html === undefined ? (
        <div className="cap-prose-page-body" data-context="prose">
          {children}
        </div>
      ) : (
        <div
          className="cap-prose-page-body"
          data-context="prose"
          dangerouslySetInnerHTML={markup(html)}
        />
      )}
    </>
  );
}
