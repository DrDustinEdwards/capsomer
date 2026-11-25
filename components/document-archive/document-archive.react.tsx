import { useId, type ReactNode } from "react";
import { Row, RowList } from "../row-list/row-list.react.tsx";
import { fileMeta } from "../generated-file/generated-file.ts";
import { Signs } from "../manual/manual.react.tsx";
import { plainLink } from "../hooks/hooks.react.tsx";

export interface ArchiveDoc {
  key: string;
  title: string;
  href: string;
  detail?: ReactNode;
  meta?: ReactNode;
}

export interface ArchiveLinkProps {
  href: string;
  className?: string;
  rel?: string;
  "aria-describedby"?: string;
  children: ReactNode;
}

export interface DocumentListProps {
  docs: readonly ArchiveDoc[];
  labelledBy?: string;
  label?: string;
  empty?: ReactNode;
  renderLink?: (props: ArchiveLinkProps) => ReactNode;
}

export function DocumentList({
  docs,
  labelledBy,
  label,
  empty = "Nothing here.",
  renderLink = plainLink,
}: DocumentListProps) {
  if (docs.length === 0) return <p className="cap-archive-empty">{empty}</p>;
  return (
    <RowList labelledBy={labelledBy} label={label}>
      {docs.map((d) => (
        <Row
          key={d.key}
          title={d.title}
          href={d.href}
          detail={d.detail}
          meta={d.meta}
          renderLink={renderLink}
        />
      ))}
    </RowList>
  );
}

export interface ArchiveGroup {
  id: string;
  title: string;
  docs: readonly ArchiveDoc[];
  href?: string;
  more?: string;
  empty?: ReactNode;
}

export interface DocumentArchiveProps {
  groups: readonly ArchiveGroup[];
  level?: 2 | 3;
  renderLink?: (props: ArchiveLinkProps) => ReactNode;
}

export function DocumentArchive({
  groups,
  level = 2,
  renderLink = plainLink,
}: DocumentArchiveProps) {
  const base = useId();
  const H = `h${level}` as "h2" | "h3";
  return (
    <div className="cap-archive">
      {groups.map((g) => {
        const id = `${base}-${g.id}`;
        return (
          <section key={g.id} className="cap-archive-group">
            <div className="cap-archive-head">
              <H id={id} className="cap-archive-title">
                {g.title}
              </H>
              {g.href
                ? renderLink({
                    href: g.href,
                    className: "cap-archive-more",
                    children: g.more ?? `All of ${g.title.toLowerCase()}`,
                  })
                : null}
            </div>
            <DocumentList docs={g.docs} labelledBy={id} empty={g.empty} renderLink={renderLink} />
          </section>
        );
      })}
    </div>
  );
}

export interface PagerDoc {
  title: string;
  href: string;
}

export interface DocumentViewerProps {
  title: ReactNode;
  level?: 1 | 2;
  before?: ReactNode;
  download?: { href: string; format?: string; bytes?: number | null; label?: string };
  children?: ReactNode;
  prev?: PagerDoc | null;
  next?: PagerDoc | null;
  collection: string;
  prevLabel?: string;
  nextLabel?: string;
  renderLink?: (props: ArchiveLinkProps) => ReactNode;
}

export function DocumentViewer({
  title,
  level = 1,
  before,
  download,
  children,
  prev = null,
  next = null,
  collection,
  prevLabel = "Previous",
  nextLabel = "Next",
  renderLink = plainLink,
}: DocumentViewerProps) {
  const H = `h${level}` as "h1" | "h2";
  const format = download?.format ?? "PDF";
  return (
    <article className="cap-docview">
      <header className="cap-docview-head">
        {before}
        <H className="cap-docview-title">{title}</H>
        {download && (
          <p className="cap-docview-download">
            <a href={download.href} className="cap-btn" data-variant="primary" download>
              {download.label ?? `Download the ${format}`}
            </a>{" "}
            <span className="cap-link-meta">{fileMeta(format, download.bytes ?? null)}</span>
          </p>
        )}
      </header>
      {children != null && <div className="cap-docview-body">{children}</div>}
      <Signs
        label={`More in ${collection}`}
        prev={prev ? { ...prev, label: prevLabel } : null}
        next={next ? { ...next, label: nextLabel } : null}
        renderLink={renderLink}
      />
    </article>
  );
}
