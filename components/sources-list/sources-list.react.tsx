export interface Source {
  // The kind: credit, music, image, article, book, web, or any other word.
  type: string;
  title: string;
  url?: string;
  authors?: string;
  publisher?: string;
  license?: string;
  note?: string;
}

export const SOURCE_KINDS: Record<string, string> = {
  credit: "Credit",
  music: "Music",
  image: "Image",
  article: "Article",
  book: "Book",
  web: "Web",
};

export interface SourcesListProps {
  sources: Source[];
  label?: string;
  // Whether an address leaves the site, for its hidden "(another site)" cue. Every absolute http(s) address by default.
  isExternal?: (url: string) => boolean;
}

const external = (url: string) => /^https?:\/\//i.test(url);

// The HTML contract in sources-list.md.
export function SourcesList({ sources, label, isExternal = external }: SourcesListProps) {
  if (!sources.length) return null;
  return (
    <ol className="cap-sources" aria-label={label}>
      {sources.map((s, i) => (
        <li className="cap-source" key={i}>
          <span className="cap-source-kind">{SOURCE_KINDS[s.type] ?? s.type}</span>
          {s.url ? (
            <a className="cap-source-title" href={s.url}>
              {s.title}
              {isExternal(s.url) ? <span className="cap-sr-only"> (another site)</span> : null}
            </a>
          ) : (
            <span className="cap-source-title">{s.title}</span>
          )}
          {s.authors ? <span>{s.authors}</span> : null}
          {s.publisher ? <span>{s.publisher}</span> : null}
          {s.license ? <span className="cap-source-license">{s.license}</span> : null}
          {s.note ? <span className="cap-source-note">{s.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}
