import type { ReactNode } from "react";

export interface ProsePageProps {
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  // Something under the title in the band (a date, a button).
  headExtra?: ReactNode;
  // The id of the h1, for a link to the top.
  titleId?: string;
}

// The HTML contract in prose-page.md: the title band, then one reading column in the prose context.
export function ProsePage({ title, lead, children, headExtra, titleId }: ProsePageProps) {
  return (
    <>
      <header className="cap-prose-page-head">
        <h1 className="cap-prose-page-title" id={titleId}>
          {title}
        </h1>
        {lead ? <p className="cap-prose-page-lead">{lead}</p> : null}
        {headExtra}
      </header>
      <div className="cap-prose-page-body" data-context="prose">
        {children}
      </div>
    </>
  );
}
