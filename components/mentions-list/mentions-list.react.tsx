import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from "react";
import type { IntentResult, MentionsData, SubmitIntent } from "../content/content.ts";
import { ContentBulkBar, PlainForm, useIntents, type FormComponent } from "../content/content.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { ACTION_KEY, ACTION_LABEL, DELETE_KEY, STATE_LABEL, VIEWS, VIEW_LABEL, actionsFor, isTypingKey, statusOf, summaryText, type Mention, type ModState } from "../moderation-queue/moderation-queue.ts";
import { listOwnsKeys, moveRowFocus, singleKeysOff } from "../row-list/row-list.ts";
import { Pill } from "../status/status.react.tsx";
import { TabLink, TabsNav } from "../tabs/tabs.react.tsx";
import { Time } from "../time/time.react.tsx";
import { countLine, currentView, emptyWords, mentionActions, mentionsHref, sweepLabel, withMentions } from "./mentions-list.ts";

export type { FormComponent, IntentResult, Mention, MentionsData, SubmitIntent };

export interface MentionsListProps {
  // The loader's view data: one page of one site's mentions.
  data: MentionsData;
  // Where the forms post, and the list's own address: usually the route itself.
  action: string;
  // The host router's form component. Without it a plain <form> is rendered.
  Form?: FormComponent;
  // The script path: posts a form and resolves with the action's result (a useFetcher wrapper).
  // With it, a decision happens in place with Undo in the message, and the keys decide.
  submit?: SubmitIntent;
  // The last result from the action, for the page that comes back after a post with no script.
  result?: IntentResult | null;
  // A fixed "now" for the times, for a test or a server's clock.
  now?: number;
}

function StatusWord({ state }: { state: ModState }) {
  const s = statusOf(state);
  return (
    <span className="cap-status" data-tone={s.tone}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: s.glyph }} />
      {s.word}
    </span>
  );
}

const nameOf = (m: Mention) => `${m.author} (${m.host})`;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

// One page of one site's mentions, the moderation queue on the contract's states: tabs with the
// site's counts, each row's decisions as forms, the bulk bar with each mention's outcome, Undo,
// paging, delete and the retention sweep behind a confirm. Every action is a form post, so it all
// works with no script; with script the keys decide (a, r, d, x, j, k) and `submit` keeps the
// page where it is.
export function MentionsList({ data, action, Form = PlainForm, submit, result = null, now }: MentionsListProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const formId = `${uid}-bulk`;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { rows, query, page, offers, can, counts } = data;
  const view = currentView(data);
  const { bulk, withheld } = mentionActions(data);
  const selectable = bulk.length > 0;
  const names = useMemo(() => new Map(rows.map((m) => [m.id, nameOf(m)])), [rows]);
  const href = (q: typeof query) => mentionsHref(action, q);

  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => setSelected((s) => s.filter((id) => names.has(id))), [names]);
  // With script a row opens in place; without, its link opens it through the address.
  const [opened, setOpened] = useState<string[]>(query.open ? [query.open] : []);
  useEffect(() => setOpened(query.open ? [query.open] : []), [query.open]);

  const rootRef = useRef<HTMLElement | null>(null);
  // Where focus goes once a decided row leaves the page: the next row's title, or the empty state.
  const focusNext = useRef<string | null>(null);
  const intents = useIntents({ action, Form, submit, result, names, cancelHref: href(query), onDone: () => setSelected([]) });

  useEffect(() => {
    const want = focusNext.current;
    const root = rootRef.current;
    if (want === null || !root || root.contains(document.activeElement)) return;
    focusNext.current = null;
    const target = (want && root.querySelector<HTMLElement>(`.cap-mq-row[data-id='${CSS.escape(want)}'] .cap-row-title a`)) || root.querySelector<HTMLElement>(".cap-mq-row .cap-row-title a") || root.querySelector<HTMLElement>(".cap-empty");
    target?.focus();
  }, [rows]);

  // The keys, with script: j and k move, a and r decide, d deletes (the kit asks first), x
  // selects. A key acts on the whole selection when the focused row is part of it.
  const keys = mounted && can.decideMentions;
  const stateRef = useRef({ selected, rows, formId });
  stateRef.current = { selected, rows, formId };
  useEffect(() => {
    if (!keys) return;
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      const list = root?.querySelector<HTMLElement>(".cap-mq-list");
      if (!root || !list || e.defaultPrevented || isTypingKey(e) || singleKeysOff() || e.repeat) return;
      if (e.key === "j" || e.key === "k") {
        if (!listOwnsKeys(list)) return;
        if (moveRowFocus(list, e.key === "j" ? 1 : -1) || list.contains(document.activeElement)) e.preventDefault();
        return;
      }
      if (e.key === "Escape") {
        if (stateRef.current.selected.length && root.contains(document.activeElement) && !document.querySelector("dialog:modal")) {
          e.preventDefault();
          setSelected([]);
        }
        return;
      }
      const row = document.activeElement?.closest<HTMLElement>(".cap-mq-row");
      if (!row || !list.contains(row) || document.querySelector("dialog:modal")) return;
      const id = row.dataset.id ?? "";
      const { selected: picked, rows: all, formId: bulkForm } = stateRef.current;
      if (e.key === "x") {
        e.preventDefault();
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
        return;
      }
      const intent = e.key === DELETE_KEY ? "delete" : e.key === ACTION_KEY.approve ? "approve" : e.key === ACTION_KEY.reject ? "reject" : null;
      if (!intent) return;
      const many = picked.length > 1 && picked.includes(id);
      const button = many ? root.querySelector<HTMLButtonElement>(`button[form='${bulkForm}'][value='${intent}']`) : row.querySelector<HTMLButtonElement>(`[data-cap-action='${intent}']`);
      if (!button?.form) return;
      e.preventDefault();
      // The row (or rows) will leave this tab: focus goes to the next one still here.
      const acted = many ? picked : [id];
      const at = all.findIndex((m) => m.id === id);
      const next = all.slice(at + 1).find((m) => !acted.includes(m.id)) ?? all.slice(0, at).reverse().find((m) => !acted.includes(m.id));
      if (intent !== "delete") focusNext.current = next?.id ?? "";
      button.form.requestSubmit(button);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [keys]);

  if (intents.confirmPage) {
    return (
      <section className="cap-mq cap-mentions" data-cap="mentions-list" aria-label="Mentions">
        {intents.confirmPage}
      </section>
    );
  }

  const selectedItems = rows.filter((m) => selected.includes(m.id)).map((m) => ({ id: m.id, label: nameOf(m) }));
  const setOne = (id: string, on: boolean) => setSelected((s) => (on ? (s.includes(id) ? s : [...s, id]) : s.filter((x) => x !== id)));
  const empty = rows.length === 0;
  const words = emptyWords(view);
  const sweep = sweepLabel(data.expiring);
  const hint = (key: string | undefined) => (keys && key ? <kbd className="cap-kbd" aria-hidden="true">{key}</kbd> : null);
  const toggle = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!mounted) return;
    e.preventDefault();
    setOpened((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  };

  return (
    <section
      className="cap-mq cap-mentions"
      data-cap="mentions-list"
      data-view={view}
      aria-labelledby={`${uid}-h`}
      ref={(el) => {
        rootRef.current = el;
        intents.rootRef.current = el;
      }}
      onSubmit={intents.onSubmit}
    >
      <h2 className="cap-sr-only" id={`${uid}-h`}>
        Mentions on {data.site.name}
      </h2>
      <TabsNav aria-label="Mentions by state" className="cap-mentions-tabs">
        {VIEWS.map((v) => (
          <TabLink key={v} href={href(withMentions(query, { view: v }))} current={view === v} count={counts[v]}>
            {VIEW_LABEL[v]}
          </TabLink>
        ))}
      </TabsNav>

      <div className="cap-mq-head">
        <p className="cap-mq-summary" role="status">
          {summaryText({ pending: counts.pending, unverified: 0 })}
        </p>
        {counts.unverified > 0 ? (
          <Pill variant="secondary" href={view === "all" ? undefined : href(withMentions(query, { view: "all" }))}>
            {counts.unverified} {STATE_LABEL.unverified.toLowerCase()}
          </Pill>
        ) : null}
        {empty ? null : <p className="cap-mentions-count">{countLine(data)}</p>}
      </div>

      {withheld.length ? (
        <ul className="cap-mentions-withheld">
          {withheld.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {intents.resultBox}

      {selectable && !empty ? (
        <ContentBulkBar formId={formId} action={action} Form={Form} formClass="cap-mentions-bulk-form" items={selectedItems} total={rows.length} onSelectAll={mounted ? () => setSelected(rows.map((m) => m.id)) : undefined} onClear={() => setSelected([])} plural="mentions" actions={bulk} tag={false} intents={intents} />
      ) : null}

      {empty ? (
        <Empty kind={words.kind} title={words.title}>
          {words.text}
        </Empty>
      ) : (
        <ul className="cap-rows cap-mq-list" role="list" aria-labelledby={`${uid}-h`} data-cap-primary="">
          {rows.map((m) => {
            const p = `${uid}-${m.id}`;
            const open = opened.includes(m.id);
            const decisions = can.decideMentions ? actionsFor(m.state, offers.reset) : [];
            const canDelete = can.decideMentions && offers.delete;
            return (
              <li key={m.id} className="cap-row cap-mq-row" data-id={m.id} data-state={m.state} data-selected={selected.includes(m.id) ? "" : undefined}>
                {selectable ? (
                  <span className="cap-mq-check">
                    <label className="cap-check">
                      <input type="checkbox" name="ids" value={m.id} form={formId} checked={selected.includes(m.id)} onChange={(e) => setOne(m.id, e.target.checked)} />
                      <span className="cap-sr-only">Select the mention from {m.author}</span>
                    </label>
                  </span>
                ) : null}
                <span className="cap-row-status" id={`${p}-s`}>
                  <StatusWord state={m.state} />
                </span>
                <div className="cap-row-title">
                  <a href={href(withMentions(query, { open: open ? undefined : m.id }))} aria-expanded={open} aria-controls={open ? `${p}-more` : undefined} aria-describedby={`${p}-s ${p}-d`} onClick={toggle(m.id)}>
                    <span className="cap-avatar" data-size="sm" aria-hidden="true">
                      <span className="cap-avatar-fallback">{initials(m.author)}</span>
                    </span>{" "}
                    <span className="cap-mq-name">{m.author}</span> <span className="cap-mq-host">{m.host}</span>
                  </a>
                </div>
                <p className="cap-row-detail" id={`${p}-d`}>
                  {m.state === "failed" && m.failureReason ? m.failureReason : `On ${m.post}: “${m.excerpt}”`}
                </p>
                <span className="cap-row-meta">
                  <Time at={m.at} now={now} />
                  <span className="cap-row-chevron" aria-hidden="true" />
                </span>
                {decisions.length || canDelete ? (
                  <Form method="post" action={action} className="cap-row-actions cap-mentions-act" aria-label={`Decide the mention from ${m.author}`}>
                    <input type="hidden" name="ids" value={m.id} />
                    {m.version ? <input type="hidden" name="version" value={m.version} /> : null}
                    {decisions.map((a) => (
                      <button key={a} type="submit" className="cap-btn" data-variant="quiet" data-size="sm" name="intent" value={a} data-cap-action={a} aria-keyshortcuts={keys ? ACTION_KEY[a] : undefined}>
                        {ACTION_LABEL[a]}
                        <span className="cap-sr-only"> the mention from {m.author}</span>
                        {hint(ACTION_KEY[a])}
                      </button>
                    ))}
                    {canDelete ? (
                      <button type="submit" className="cap-btn" data-variant="danger" data-size="sm" name="intent" value="delete" data-cap-action="delete" aria-keyshortcuts={keys ? DELETE_KEY : undefined}>
                        Delete
                        <span className="cap-sr-only"> the mention from {m.author}</span>
                        {hint(DELETE_KEY)}
                      </button>
                    ) : null}
                  </Form>
                ) : null}
                {open ? (
                  <div className="cap-mq-more" id={`${p}-more`}>
                    <blockquote className="cap-mq-quote">{m.excerpt}</blockquote>
                    <dl className="cap-mq-facts">
                      <dt>From</dt>
                      <dd>{m.author}</dd>
                      <dt>Source</dt>
                      <dd>
                        {m.external && m.url ? (
                          <>
                            <a href={m.url} rel="nofollow ugc noopener" data-external="">
                              {m.url}
                            </a>{" "}
                            (opens the sender's page)
                          </>
                        ) : (
                          <span className="cap-mono">{m.url ?? m.host}</span>
                        )}
                      </dd>
                      <dt>On</dt>
                      <dd>{m.postHref ? <a href={m.postHref}>{m.post}</a> : m.post}</dd>
                      <dt>Received</dt>
                      <dd>
                        <Time at={m.at} format="exact" now={now} />
                      </dd>
                      {m.decidedAt ? (
                        <>
                          <dt>Decided</dt>
                          <dd>
                            <Time at={m.decidedAt} format="exact" now={now} />
                          </dd>
                        </>
                      ) : null}
                    </dl>
                    {m.state === "failed" ? (
                      <p className="cap-mq-why">
                        <b>Source not found.</b> {m.failureReason ? `${m.failureReason} ` : ""}Its excerpt is kept, so you can see what was sent; it cannot be approved or rejected.
                      </p>
                    ) : m.state === "unverified" ? (
                      <p className="cap-mq-why">
                        <b>Not yet checked.</b> The site has not read its source yet. It can be decided once it has.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {query.cursor || page.nextCursor ? (
        <nav className="cap-mentions-pages" aria-label="Mentions pages">
          {query.cursor ? (
            <a className="cap-btn" href={href(withMentions(query, { view: query.view }))}>
              First page
            </a>
          ) : null}
          {page.nextCursor ? (
            <a className="cap-btn" href={href({ view: query.view, cursor: page.nextCursor })}>
              Next page
            </a>
          ) : null}
        </nav>
      ) : null}

      {offers.sweep && can.decideMentions ? (
        <Form method="post" action={action} className="cap-mq-retention" aria-label="Retention">
          <p id={`${uid}-ret`}>{data.retention ?? "This site removes a mention whose source was not found, and a rejected one, once its retention has passed. Waiting and approved mentions are never removed."}</p>
          <button type="submit" className="cap-btn" name="intent" value="sweep" aria-describedby={`${uid}-ret`} disabled={sweep.n === 0}>
            {sweep.label}
          </button>
        </Form>
      ) : null}

      {intents.confirmDialog}
    </section>
  );
}
