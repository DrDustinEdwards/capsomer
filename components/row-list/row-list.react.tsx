import { useEffect, useId, useRef, type ReactNode } from "react";
import { attachRowList } from "./row-list.ts";

export interface RowListProps {
  // The list's name: the heading id that names it (preferred), or a label.
  labelledBy?: string;
  label?: string;
  // The page's main list: j and k work on it even before focus is inside it. One per page.
  primary?: boolean;
  children: ReactNode;
}

export function RowList({ labelledBy, label, primary = false, children }: RowListProps) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => (ref.current ? attachRowList(ref.current) : undefined), []);
  return (
    // role="list" keeps list semantics in Safari, which drops them from a list-style: none list.
    <ul ref={ref} className="cap-rows" data-cap="row-list" role="list" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : label} data-cap-primary={primary ? "" : undefined}>
      {children}
    </ul>
  );
}

export interface RowLinkProps {
  href: string;
  "aria-describedby"?: string;
  children: ReactNode;
}

export interface RowProps {
  title: ReactNode;
  // The row opens its detail by following href (a link), or by calling onOpen (a button)
  // when the detail opens in place, such as a side panel.
  href?: string;
  onOpen?: () => void;
  // A status (.cap-status: glyph, word and colour), shown first.
  status?: ReactNode;
  detail?: ReactNode;
  // The time or other trailing fact, usually a .cap-time.
  meta?: ReactNode;
  // Real buttons, raised above the stretched link.
  actions?: ReactNode;
  tone?: "crit";
  // A router's link component; a plain <a> by default.
  renderLink?: (props: RowLinkProps) => ReactNode;
}

const plainLink = ({ children, ...props }: RowLinkProps) => <a {...props}>{children}</a>;

export function Row({ title, href, onOpen, status, detail, meta, actions, tone, renderLink = plainLink }: RowProps) {
  const id = useId();
  // The link's name is the title; the status and the detail are its description, so a
  // screen reader moving by link still hears "Critical" and why.
  const described = [status != null ? `${id}-status` : "", detail != null ? `${id}-detail` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <li className="cap-row" data-tone={tone}>
      {status != null && (
        <span className="cap-row-status" id={`${id}-status`}>
          {status}
        </span>
      )}
      <div className="cap-row-title">
        {href != null ? (
          renderLink({ href, "aria-describedby": described, children: title })
        ) : (
          <button type="button" aria-describedby={described} onClick={onOpen}>
            {title}
          </button>
        )}
      </div>
      {detail != null && (
        <p className="cap-row-detail" id={`${id}-detail`}>
          {detail}
        </p>
      )}
      {meta != null && <span className="cap-row-meta">{meta}</span>}
      {actions != null && <div className="cap-row-actions">{actions}</div>}
    </li>
  );
}
