import type { ReactNode } from "react";
import { foldAuthors, nameOf, type Author } from "./author-list.ts";

export type { Author } from "./author-list.ts";

export interface AuthorListProps {
  // The names in byline order: strings, or `{ name, href }` for a name that links.
  authors: readonly Author[];
  // Marks the site owner's own name (by the name as given). Without it no name is marked.
  isOwner?: (name: string) => boolean;
  // Fold a list longer than this many names into a disclosure ("A, B, C and 9 more"). Leave it out to show every name.
  collapse?: number;
  // How a name is shown, for a site that decodes entities or italicizes; the owner check still reads the name as given.
  format?: (name: string) => ReactNode;
}

function Name({
  author,
  owner,
  format,
  linked,
}: {
  author: Author;
  owner: boolean;
  format: (name: string) => ReactNode;
  linked: boolean;
}) {
  const name = nameOf(author);
  const href = typeof author === "string" ? undefined : author.href;
  const shown = linked && href ? <a href={href}>{format(name)}</a> : format(name);
  return owner ? <strong className="cap-author-list-owner">{shown}</strong> : <>{shown}</>;
}

function Names({
  authors,
  isOwner,
  format,
  linked,
}: {
  authors: readonly Author[];
  isOwner: (name: string) => boolean;
  format: (name: string) => ReactNode;
  linked: boolean;
}) {
  return (
    <>
      {authors.map((a, i) => (
        <span key={`${nameOf(a)}-${i}`}>
          {i > 0 ? ", " : ""}
          <Name author={a} owner={isOwner(nameOf(a))} format={format} linked={linked} />
        </span>
      ))}
    </>
  );
}

const plain = (name: string): ReactNode => name;
const nobody = () => false;

// The byline of a paper, a report or a post: every name, the owner's in strong; folded into a
// `details` when `collapse` is given and the list is longer. A summary holds no links (a link inside
// the summary button is a control inside a control), so linked names link in the full list only.
export function AuthorList({
  authors,
  isOwner = nobody,
  collapse,
  format = plain,
}: AuthorListProps) {
  if (authors.length === 0) return null;
  const fold = collapse === undefined ? null : foldAuthors(authors, isOwner, collapse);
  if (!fold?.folded) {
    return (
      <p className="cap-author-list">
        <Names authors={authors} isOwner={isOwner} format={format} linked />
      </p>
    );
  }
  return (
    <details className="cap-author-list">
      <summary className="cap-author-list-summary">
        <Names authors={fold.lead} isOwner={isOwner} format={format} linked={false} />
        {fold.owner ? (
          <>
            <span className="cap-author-list-more">{fold.lead.length > 0 ? ", ... " : "... "}</span>
            <Name author={fold.owner} owner format={format} linked={false} />
          </>
        ) : null}
        <span className="cap-author-list-more"> and {fold.more} more</span>
      </summary>
      <p className="cap-author-list-full">
        <Names authors={fold.all} isOwner={isOwner} format={format} linked />
      </p>
    </details>
  );
}
