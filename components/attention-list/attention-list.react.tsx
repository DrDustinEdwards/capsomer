import { useId, useState, type ReactNode } from "react";
import { TONE_WORD, arrange, type AttentionItem, type AttentionTone } from "./attention-list.ts";

export type { AttentionItem, AttentionTone } from "./attention-list.ts";

export interface AttentionLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

export interface AttentionListProps {
  items: AttentionItem[];
  title?: string;
  // How fresh the reading is, after "Worst first.": "Read 40 seconds ago".
  read?: ReactNode;
  headingLevel?: 2 | 3;
  // Said beside the ok status when nothing needs attention.
  clearText?: string;
  // A router's link component; a plain <a> by default.
  renderLink?: (props: AttentionLinkProps) => ReactNode;
}

// The status glyphs: shape, beside the word and the colour. Decorative; the word is the name.
const GLYPH: Record<AttentionTone | "ok", ReactNode> = {
  crit: (
    <>
      <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" />
      <path fill="var(--surface)" d="M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" />
    </>
  ),
  warn: (
    <>
      <path fill="currentColor" d="M8 1.2 15.4 14H.6z" />
      <path fill="var(--surface)" d="M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" />
    </>
  ),
  info: (
    <>
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" />
    </>
  ),
  nodata: <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.6 2.2" />,
  ok: (
    <>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path fill="none" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m4.6 8.3 2.3 2.3 4.5-4.9" />
    </>
  ),
};

function Glyph({ tone }: { tone: AttentionTone | "ok" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {GLYPH[tone]}
    </svg>
  );
}

function Status({ tone }: { tone: AttentionTone }) {
  return (
    <span className="cap-status" data-tone={tone}>
      <Glyph tone={tone} />
      {TONE_WORD[tone]}
    </span>
  );
}

const plainLink = ({ children, ...props }: AttentionLinkProps) => <a {...props}>{children}</a>;

function Row({ item, renderLink }: { item: AttentionItem; renderLink: (p: AttentionLinkProps) => ReactNode }) {
  const when = typeof item.when === "string" ? item.when : item.when ? <time className="cap-time" dateTime={item.when.datetime}>{item.when.text}</time> : null;
  return (
    <li className="cap-row" data-tone={item.tone === "crit" ? "crit" : undefined}>
      <Status tone={item.tone} />
      <div className="cap-row-main">
        {renderLink({ href: item.href, className: "cap-row-title", children: item.title })}
        {item.detail ? <div className="cap-row-detail">{item.detail}</div> : null}
      </div>
      <div className="cap-row-meta">{when}</div>
    </li>
  );
}

// No data-cap here: React owns the group state, so the behaviour module must not attach.
export function AttentionList(props: AttentionListProps) {
  const { items, title = "Needs attention", read, headingLevel = 2, clearText = "Nothing needs you.", renderLink = plainLink } = props;
  const id = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const entries = arrange(items);
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <section className="cap-attention" aria-labelledby={`${id}-h`}>
      <header className="cap-attention-head">
        <Heading id={`${id}-h`} className="cap-attention-title">
          {title}
        </Heading>
        <span className="cap-attention-src">
          Worst first.{read ? <> {read}</> : null}
        </span>
      </header>
      {entries.length ? (
        <ul className="cap-rows">
          {entries.map((e) => {
            if (e.kind === "row") return <Row key={e.item.id} item={e.item} renderLink={renderLink} />;
            const membersId = `${id}-g-${e.key.replace(/\W+/g, "-")}`;
            const isOpen = open.has(e.key);
            return (
              <li className="cap-attention-group" key={`group-${e.key}`}>
                <div className="cap-attention-group-head">
                  <Status tone={e.tone} />
                  <div className="cap-group">
                    <button type="button" aria-expanded={isOpen} aria-controls={membersId} data-cap-part="group-toggle" onClick={() => toggle(e.key)}>
                      {e.label}
                    </button>
                  </div>
                </div>
                <div className="cap-attention-members" id={membersId} hidden={!isOpen}>
                  <ul className="cap-rows">
                    {e.items.map((item) => (
                      <Row key={item.id} item={item} renderLink={renderLink} />
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="cap-attention-clear">
          <span className="cap-status" data-tone="ok">
            <Glyph tone="ok" />
            All clear
          </span>
          <span className="cap-attention-clear-text">{clearText}</span>
        </p>
      )}
    </section>
  );
}
