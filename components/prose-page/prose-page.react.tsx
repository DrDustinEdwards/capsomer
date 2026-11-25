import type { ReactNode } from "react";
import { markup } from "../trusted-html/trusted-html.ts";

export interface ProsePageHeadProps {
  title: ReactNode;
  headExtra?: ReactNode;
  titleId?: string;
}

export interface ProsePageProps extends ProsePageHeadProps {
  children?: ReactNode;
  // The body as HTML the server already sanitized (a page stored as HTML), in place of children,
  // through the `capsomer` Trusted Types policy.
  html?: string;
}

export function ProsePageHead({ title, headExtra, titleId }: ProsePageHeadProps) {
  return (
    <header className="cap-prose-page-head">
      <h1 className="cap-prose-page-title" id={titleId}>
        {title}
      </h1>
      {headExtra}
    </header>
  );
}

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
