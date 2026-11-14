import { useEffect, useId, useRef, type ReactNode } from "react";
import { MIN_ITEMS, attach } from "./toc.ts";

export interface TocItem {
  id: string;
  text: string;
  // 2 for an h2, 3 for an h3 (indented under it).
  level: number;
}

export interface TocProps {
  items: TocItem[];
  // "sidebar": a sticky column, shown from 64rem. "inline": a disclosure, shown under 64rem.
  // Render both for a post that has a sidebar column on a wide screen.
  variant: "sidebar" | "inline";
  title?: ReactNode;
  // Under this many items nothing renders: a short post needs no contents.
  min?: number;
}

// The HTML contract in toc.md.
export function Toc({ items, variant, title = "Contents", min = MIN_ITEMS }: TocProps) {
  const ref = useRef<HTMLElement>(null);
  const id = useId();
  // This list only: a sibling's own effect attaches the sibling.
  useEffect(() => (ref.current ? attach(ref.current) : undefined), []);
  if (items.length < min) return null;
  const list = (
    <ol className="cap-toc-list">
      {items.map((item) => (
        <li key={item.id} className="cap-toc-item" data-level={item.level === 3 ? "3" : undefined}>
          <a className="cap-toc-link" href={`#${item.id}`}>
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
  if (variant === "inline")
    return (
      <details className="cap-toc" data-variant="inline">
        <summary className="cap-toc-title">{title}</summary>
        <nav ref={ref} data-cap="toc" aria-label="Contents">
          {list}
        </nav>
      </details>
    );
  return (
    <nav ref={ref} className="cap-toc" data-variant="sidebar" data-cap="toc" aria-labelledby={id}>
      <p className="cap-toc-title" id={id}>
        {title}
      </p>
      {list}
    </nav>
  );
}
