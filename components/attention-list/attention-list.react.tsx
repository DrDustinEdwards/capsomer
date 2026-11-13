import { plural } from "../hooks/hooks.ts";
import { Fragment, useEffect, useId, useState, type ReactNode } from "react";
import { Empty } from "../empty/empty.react.tsx";
import { Spinner } from "../skeleton/skeleton.react.tsx";
import { useOptionalMessage } from "../message/message.react.tsx";
import {
  Row,
  RowList,
  usePlainRowForm,
  type RowForm,
  type RowLinkProps,
} from "../row-list/row-list.react.tsx";
import { Pill, Status } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";
import {
  URGENCY_ORDER,
  URGENCY_TITLE,
  focusNeighbor,
  needsShown,
  type Need,
  TONE_WORD,
  arrange,
  problemCount,
  viewLinkText,
  type AttentionEntry,
  type AttentionGroupEntry,
  type AttentionGroupInfo,
  type AttentionItem,
} from "./attention-list.ts";

export type {
  AttentionGroupInfo,
  AttentionItem,
  AttentionTone,
  Inbox,
  InboxApp,
  InboxItem,
  InboxSeverity,
  Need,
  NeedUrgency,
} from "./attention-list.ts";
export type { RowForm };

export type AttentionLinkProps = RowLinkProps;

export interface AttentionListProps {
  items: AttentionItem[];
  title?: string;
  // How fresh the reading is, after "Worst first.": "Read 40 seconds ago".
  read?: ReactNode;
  // The list is being read again: the last good rows stay, the section is marked busy and a spinner
  // says "Reading again" in place of `read`, as a panel's `reading` does (patterns.md "Loading").
  reading?: boolean;
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
  return typeof when === "string" ? (
    when
  ) : when ? (
    <time className="cap-time" dateTime={when.datetime}>
      {when.text}
    </time>
  ) : null;
}

// No data-cap here: React owns the open and closed state, so the behavior module must not
// attach (it would toggle twice).
export function AttentionList(props: AttentionListProps) {
  const {
    items,
    title = "Needs attention",
    read,
    reading = false,
    headingLevel = 2,
    clearText = "Nothing needs you.",
    noticesDetail = "Nothing to act on now",
    groups,
    problemRows,
    groupRows,
    primary = true,
    renderLink = plainLink,
  } = props;
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
      return (
        <Row
          key={item.id}
          tone={item.tone === "crit" ? "crit" : undefined}
          status={<Status tone={item.tone}>{TONE_WORD[item.tone]}</Status>}
          title={item.title}
          href={item.href}
          detail={item.detail}
          meta={whenOf(item.when)}
          renderLink={renderLink}
        />
      );
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
        <Row
          status={<Status tone={g.tone}>{TONE_WORD[g.tone]}</Status>}
          title={g.label}
          onOpen={() => toggle(`group-${g.key}`)}
          expanded={isOpen}
          controls={rid}
          detail={g.detail}
          meta={whenOf(g.when)}
        />
        <li className="cap-attention-region" id={rid} hidden={!isOpen}>
          <ul role="list" aria-label={g.label}>
            {g.items.map((item) => (
              <Row
                key={item.id}
                className="cap-attention-child"
                title={item.title}
                href={item.href}
                detail={item.detail}
                meta={whenOf(item.when)}
                renderLink={renderLink}
              />
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
    <section className="cap-attention" aria-labelledby={`${id}-h`} aria-busy={reading || undefined}>
      <header className="cap-attention-head">
        <Heading id={`${id}-h`} className="cap-attention-title">
          {title}
        </Heading>
        <span className="cap-attention-count">{problemCount(arranged)}</span>
        <span className="cap-attention-src">
          Worst first.
          {reading ? (
            <>
              {" "}
              <Spinner size="sm" label="Reading again" />
            </>
          ) : read ? (
            <> {read}</>
          ) : null}
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
                <button
                  type="button"
                  aria-expanded={moreOpen}
                  aria-controls={regionId("more")}
                  onClick={() => toggle("more")}
                >
                  {moreOpen
                    ? "Fewer warnings"
                    : `${arranged.more.length} more ${arranged.more.length === 1 ? "warning" : "warnings"}`}
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
                title={plural(n, "notice", "notices")}
                onOpen={() => toggle("notices")}
                expanded={noticesOpen}
                controls={regionId("notices")}
                detail={noticesDetail}
              />
              <li className="cap-attention-region" id={regionId("notices")} hidden={!noticesOpen}>
                <ul role="list" aria-label="Notices">
                  {arranged.notices.map((item) => (
                    <Row
                      key={item.id}
                      className="cap-attention-child"
                      title={item.title}
                      href={item.href}
                      detail={[TONE_WORD[item.tone], item.detail].filter(Boolean).join(" · ")}
                      meta={whenOf(item.when)}
                      renderLink={renderLink}
                    />
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

// ---- NeedsList: a person's work queue, with Later ----------------------------------------

// A link a needs list draws: a row's title, or its main action (a primary button).
export interface NeedLinkProps extends RowLinkProps {
  className?: string;
  "data-variant"?: string;
}

const plainNeedLink = ({ children, ...props }: NeedLinkProps) => <a {...props}>{children}</a>;

export interface NeedsListProps<G extends string = string> {
  needs: Need<G>[];
  // "all", "later" (what is set aside) or one of the app's groups.
  show: "all" | "later" | G;
  // The list's name. Default "Needs you", or "Set aside for later".
  label?: string;
  // The person's zone, sent with Later so the server brings the row back at 8 am there (the
  // server's own guess when the script is off).
  zone: string;
  // A router's link component; a plain <a> by default.
  renderLink?: (props: NeedLinkProps) => ReactNode;
  // Each row's form for Later and Bring back (React Router: useRouterRowForm). The form posts
  // intent ("later" or "back"), need, title and zone. Default: a plain form that posts.
  useRowForm?: () => RowForm;
  // Undo of a Later: bring the need back (post intent "back").
  onBack?: (need: Need<G>) => void;
  // The key that opens search ("⌘" or "Ctrl"), to name it in the keys line; left out without.
  searchKey?: string;
  // The empty state's words, for the list and for Later.
  emptyText?: ReactNode;
  emptyLaterText?: ReactNode;
  // The page's main list: j and k work on it before focus is inside it.
  primary?: boolean;
}

function NeedRow<G extends string>({
  need,
  zone,
  noteId,
  onBack,
  renderLink,
  useRowForm,
}: {
  need: Need<G>;
  zone: string;
  noteId: string;
  onBack?: (need: Need<G>) => void;
  renderLink: (props: NeedLinkProps) => ReactNode;
  useRowForm: () => RowForm;
}) {
  const { Form, pending } = useRowForm();
  const message = useOptionalMessage();
  // The row leaves the list as soon as it is sent; it is back if the server refused it.
  if (pending) return null;
  const aside = need.later !== undefined;
  return (
    <Row
      className="cap-need-row"
      title={need.title}
      href={need.action.href}
      detail={need.detail}
      meta={
        aside ? (
          <span>
            Back <Time at={need.later!} />
          </span>
        ) : need.at ? (
          <Time at={need.at} />
        ) : undefined
      }
      renderLink={renderLink}
      actions={
        <>
          <Form
            method="post"
            onSubmit={(e) => {
              const row = e.currentTarget.closest<HTMLElement>(".cap-need-row");
              if (row) focusNeighbor(row);
              if (aside) message?.say(`Back on the list: ${need.title}`);
              else
                message?.say(`Set for later, until tomorrow morning: ${need.title}`, {
                  undo: onBack ? () => onBack(need) : undefined,
                  undone: `Back on the list: ${need.title}`,
                });
            }}
          >
            <input type="hidden" name="intent" value={aside ? "back" : "later"} />
            <input type="hidden" name="need" value={need.id} />
            <input type="hidden" name="title" value={need.title} />
            <input type="hidden" name="zone" value={zone} />
            <button
              type="submit"
              className="cap-btn"
              data-variant="quiet"
              data-cap-part="later"
              aria-describedby={aside ? undefined : noteId}
            >
              {aside ? "Bring back" : "Later"}
            </button>
          </Form>
          {renderLink({
            href: need.action.href,
            className: "cap-btn",
            "data-variant": "primary",
            children: need.action.label,
          })}
        </>
      }
    />
  );
}

// What waits on one person, Blocking first, then Waiting for you, oldest first within each, as
// one row list (so j and k move through both) with the urgency headings between the rows. Each
// row has its one main action and Later, which sets it aside until 8 am tomorrow in the
// person's zone; the row leaves at once, focus moves to the next row, and the message offers
// Undo. `l` on a row sets it aside (or brings it back in the Later view): a single key that acts
// only while focus is on a row (WCAG 2.1.4) and obeys `data-cap-single-keys="off"` on <html>.
// From Carrel's Home (app/routes/home.tsx).
export function NeedsList<G extends string = string>({
  needs,
  show,
  label,
  zone,
  renderLink = plainNeedLink,
  useRowForm = usePlainRowForm,
  onBack,
  searchKey,
  emptyText,
  emptyLaterText,
  primary,
}: NeedsListProps<G>) {
  const noteId = useId();
  const later = show === "later";
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "l" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      if (document.documentElement.dataset.capSingleKeys === "off") return;
      const row = document.activeElement?.closest<HTMLElement>(".cap-need-row");
      const button = row?.querySelector<HTMLButtonElement>("[data-cap-part='later']");
      if (!button) return;
      e.preventDefault();
      button.click();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const rows = needsShown(needs, show);
  if (rows.length === 0)
    return later ? (
      <Empty kind="all-clear" flush title="Nothing set aside">
        {emptyLaterText ?? "Later on a row hides it until tomorrow morning."}
      </Empty>
    ) : (
      <Empty kind="all-clear" flush title="Nothing needs you">
        {emptyText ??
          (show === "all" ? "Everything waiting on you is done." : "Nothing here. Try All.")}
      </Empty>
    );
  return (
    <>
      <RowList label={label ?? (later ? "Set aside for later" : "Needs you")} primary={primary}>
        {URGENCY_ORDER.map((u) => {
          const group = rows.filter((n) => n.urgency === u);
          if (group.length === 0) return null;
          return [
            <li key={u} className="cap-need-group">
              <h3 className="cap-need-head">
                <Pill tone={u === "blocking" ? "crit" : undefined} variant="secondary">
                  {URGENCY_TITLE[u]}
                </Pill>
                <span className="cap-need-count">{group.length}</span>
              </h3>
            </li>,
            ...group.map((n) => (
              <NeedRow
                key={n.id}
                need={n}
                zone={zone}
                noteId={noteId}
                onBack={onBack}
                renderLink={renderLink}
                useRowForm={useRowForm}
              />
            )),
          ];
        })}
      </RowList>
      <p className="cap-need-keys">
        <span className="cap-need-key">
          <kbd>j</kbd> <kbd>k</kbd> move
        </span>
        <span className="cap-need-key">
          <kbd>Enter</kbd> open
        </span>
        <span className="cap-need-key">
          <kbd>l</kbd> {later ? "bring back" : "later"}
        </span>
        {searchKey ? (
          <span className="cap-need-key">
            <kbd>{searchKey}</kbd> <kbd>K</kbd> search
          </span>
        ) : null}
        <span id={noteId}>
          {later
            ? "These come back on their own at 8 am, or sooner if they change."
            : "Later hides a row until 8 am tomorrow, or sooner if it changes."}
        </span>
      </p>
    </>
  );
}
