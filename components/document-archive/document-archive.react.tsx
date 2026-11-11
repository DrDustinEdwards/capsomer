import { useId, type ReactNode } from "react";
import { Row, RowList } from "../row-list/row-list.react.tsx";
import { fileMeta } from "../generated-file/generated-file.ts";

export interface ArchiveDoc {
  key: string;
  title: string;
  // The document's page in the archive.
  href: string;
  // The line under the title: "Fall 2026 · Editor: Sam Lee".
  detail?: ReactNode;
  // The trailing fact: "PDF, 2.4 MB", or the year.
  meta?: ReactNode;
}

export interface ArchiveLinkProps {
  href: string;
  className?: string;
  rel?: string;
  "aria-describedby"?: string;
  children: ReactNode;
}

const plainLink = ({ children, ...props }: ArchiveLinkProps) => <a {...props}>{children}</a>;

export interface DocumentListProps {
  docs: readonly ArchiveDoc[];
  // The list's name: the id of the heading over it (preferred), or a label.
  labelledBy?: string;
  label?: string;
  // What an empty category says.
  empty?: ReactNode;
  renderLink?: (props: ArchiveLinkProps) => ReactNode;
}

// One category's documents: a row list, each row's title the link to the document's page.
export function DocumentList({
  docs,
  labelledBy,
  label,
  empty = "Nothing here yet.",
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
  // The category's own page, when this view shows only its first few.
  href?: string;
  // The link's words: "All 24 programs".
  more?: string;
  empty?: ReactNode;
}

export interface DocumentArchiveProps {
  groups: readonly ArchiveGroup[];
  // The categories' heading level. Default 2.
  level?: 2 | 3;
  renderLink?: (props: ArchiveLinkProps) => ReactNode;
}

// Every category, each under its heading with its list and, when it is cut short, a link to
// the rest.
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

export interface DocumentPagerProps {
  prev: PagerDoc | null;
  next: PagerDoc | null;
  // The category's name, for the nav's name: "More in Programs".
  collection: string;
  prevLabel?: string;
  nextLabel?: string;
  renderLink?: (props: ArchiveLinkProps) => ReactNode;
}

// Previous and Next in the category, each with the document's title. A missing end is left out,
// and Next keeps its place on the right.
export function DocumentPager({
  prev,
  next,
  collection,
  prevLabel = "Previous",
  nextLabel = "Next",
  renderLink = plainLink,
}: DocumentPagerProps) {
  if (!prev && !next) return null;
  const side = (doc: PagerDoc, rel: "prev" | "next", word: string) =>
    renderLink({
      href: doc.href,
      rel,
      className: "cap-docpager-link",
      children: (
        <>
          <span className="cap-docpager-dir">{word}</span>{" "}
          <span className="cap-docpager-title">{doc.title}</span>
        </>
      ),
    });
  return (
    <nav className="cap-docpager" aria-label={`More in ${collection}`}>
      {prev ? side(prev, "prev", prevLabel) : null}
      {next ? side(next, "next", nextLabel) : null}
    </nav>
  );
}

export interface DocumentViewerProps {
  title: ReactNode;
  // "Fall 2026 · Editor: Sam Lee".
  subtitle?: ReactNode;
  // The page's heading level for the title. Default 1: the document is the page.
  level?: 1 | 2;
  // Above the title: the page's breadcrumb.
  before?: ReactNode;
  download?: { href: string; format?: string; bytes?: number | null; label?: string };
  // The viewer itself (the app's PDF viewer), or a cover and summary.
  children?: ReactNode;
  prev?: PagerDoc | null;
  next?: PagerDoc | null;
  collection: string;
  renderLink?: (props: ArchiveLinkProps) => ReactNode;
}

// One document's page: its title, the download, the viewer the app gives it, and Previous and
// Next in its category.
export function DocumentViewer({
  title,
  subtitle,
  level = 1,
  before,
  download,
  children,
  prev = null,
  next = null,
  collection,
  renderLink = plainLink,
}: DocumentViewerProps) {
  const H = `h${level}` as "h1" | "h2";
  const format = download?.format ?? "PDF";
  return (
    <article className="cap-docview">
      <header className="cap-docview-head">
        {before}
        <H className="cap-docview-title">{title}</H>
        {subtitle != null && <p className="cap-docview-sub">{subtitle}</p>}
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
      <DocumentPager prev={prev} next={next} collection={collection} renderLink={renderLink} />
    </article>
  );
}
