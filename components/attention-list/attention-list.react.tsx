import { Fragment, useId, useState, type ReactNode } from "react";
import { Row, RowList, type RowLinkProps } from "../row-list/row-list.react.tsx";
import { Status } from "../status/status.react.tsx";
import { TONE_WORD, arrange, problemCount, viewLinkText, type AttentionEntry, type AttentionGroupEntry, type AttentionGroupInfo, type AttentionItem } from "./attention-list.ts";

export type { AttentionGroupInfo, AttentionItem, AttentionTone } from "./attention-list.ts";

export type AttentionLinkProps = RowLinkProps;

export interface AttentionListProps {
  items: AttentionItem[];
  title?: string;
  // How fresh the reading is, after "Worst first.": "Read 40 seconds ago".
  read?: ReactNode;
  headingLevel?: 2 | 3;
  // Said beside the ok status when no problem needs attention.
  clearText?: string;
  // Said under the notices row's count: what a notice is here.
  noticesDetail?: string;
  // What a folded group is called, what its rows have in common and where all of them are.
  groups?: Record<string, AttentionGroupInfo>;
  // Problem rows shown at once before "N more warnings" (critical rows always show), and the
  // rows a group shows before its link to the view. The Portal's 8 and 5.
  problemRows?: number;
  groupRows?: number;
  // The page's main list: j and k work on it before focus is inside it. One per page.
  primary?: boolean;
  // A router's link component; a plain <a> by default.
  renderLink?: (props: RowLinkProps) => ReactNode;
}

const plainLink = ({ children, ...props }: RowLinkProps) => <a {...props}>{children}</a>;

function whenOf(when: AttentionItem["when"]): ReactNode {
  return typeof when === "string" ? when : when ? <time className="cap-time" dateTime={when.datetime}>{when.text}</time> : null;
}

// No data-cap here: React owns the open and closed state, so the behaviour module must not
// attach (it would toggle twice).
export function AttentionList(props: AttentionListProps) {
  const { items, title = "Needs attention", read, headingLevel = 2, clearText = "Nothing needs you.", noticesDetail = "Nothing to act on now", groups, problemRows, groupRows, primary = true, renderLink = plainLink } = props;
  const id = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const arranged = arrange(items, { rows: problemRows, children: groupRows, groups });
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const regionId = (key: string) => `${id}-r-${key.replace(/\W+/g, "-")}`;

  const entry = (e: AttentionEntry) => {
    if (e.kind === "row") {
      const { item } = e;
      return <Row key={item.id} tone={item.tone === "crit" ? "crit" : undefined} status={<Status tone={item.tone}>{TONE_WORD[item.tone]}</Status>} title={item.title} href={item.href} detail={item.detail} meta={whenOf(item.when)} renderLink={renderLink} />;
    }
    return group(e);
  };

  // A function, not a component: its identity must not change between renders, or a group
  // would remount (and lose focus) each time one opens.
  const group = (g: AttentionGroupEntry) => {
    const rid = regionId(`group-${g.key}`);
    const isOpen = open.has(`group-${g.key}`);
    const link = viewLinkText(g);
    return (
      <Fragment key={`group-${g.key}`}>
        <Row status={<Status tone={g.tone}>{TONE_WORD[g.tone]}</Status>} title={g.label} onOpen={() => toggle(`group-${g.key}`)} expanded={isOpen} controls={rid} detail={g.detail} meta={whenOf(g.when)} />
        <li className="cap-attention-region" id={rid} hidden={!isOpen}>
          <ul role="list" aria-label={g.label}>
            {g.items.map((item) => (
              <Row key={item.id} className="cap-attention-child" title={item.title} href={item.href} detail={item.detail} meta={whenOf(item.when)} renderLink={renderLink} />
            ))}
            {g.view && link ? (
              <li className="cap-attention-link">
                {renderLink({ href: g.view.href, children: link })}
              </li>
            ) : null}
          </ul>
        </li>
      </Fragment>
    );
  };

  const moreOpen = open.has("more");
  const noticesOpen = open.has("notices");
  const n = arranged.noticeCount;
  const empty = arranged.problems.length === 0 && arranged.more.length === 0;

  return (
    <section className="cap-attention" aria-labelledby={`${id}-h`}>
      <header className="cap-attention-head">
        <Heading id={`${id}-h`} className="cap-attention-title">
          {title}
        </Heading>
        <span className="cap-attention-count">{problemCount(arranged)}</span>
        <span className="cap-attention-src">
          Worst first.{read ? <> {read}</> : null}
        </span>
      </header>
      {empty ? (
        <p className="cap-attention-clear">
          <Status tone="ok">All clear</Status>
          <span className="cap-attention-clear-text">{clearText}</span>
        </p>
      ) : null}
      {!empty || arranged.notices.length ? (
        <RowList labelledBy={`${id}-h`} primary={primary}>
          {arranged.problems.map(entry)}
          {arranged.more.length ? (
            <>
              <li className="cap-attention-link">
                <button type="button" aria-expanded={moreOpen} aria-controls={regionId("more")} onClick={() => toggle("more")}>
                  {moreOpen ? "Fewer warnings" : `${arranged.more.length} more ${arranged.more.length === 1 ? "warning" : "warnings"}`}
                </button>
              </li>
              <li className="cap-attention-region" id={regionId("more")} hidden={!moreOpen}>
                <ul role="list" aria-label="More warnings">
                  {arranged.more.map(entry)}
                </ul>
              </li>
            </>
          ) : null}
          {arranged.notices.length ? (
            <>
              <Row
                className="cap-attention-notices"
                status={<Status tone="info">{TONE_WORD.info}</Status>}
                title={`${n} ${n === 1 ? "notice" : "notices"}`}
                onOpen={() => toggle("notices")}
                expanded={noticesOpen}
                controls={regionId("notices")}
                detail={noticesDetail}
              />
              <li className="cap-attention-region" id={regionId("notices")} hidden={!noticesOpen}>
                <ul role="list" aria-label="Notices">
                  {arranged.notices.map((item) => (
                    <Row key={item.id} className="cap-attention-child" title={item.title} href={item.href} detail={[TONE_WORD[item.tone], item.detail].filter(Boolean).join(" · ")} meta={whenOf(item.when)} renderLink={renderLink} />
                  ))}
                </ul>
              </li>
            </>
          ) : null}
        </RowList>
      ) : null}
    </section>
  );
}
