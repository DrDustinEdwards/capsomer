import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { ContentLabels, IntentResult, PostRow, PostsData, ScheduledUpdateView, SubmitIntent } from "../content/content.ts";
import { ContentBulkBar, PlainForm, useIntents, type FormComponent } from "../content/content.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { FormMenu } from "../menu/menu.react.tsx";
import { Pill, Status } from "../status/status.react.tsx";
import { TabLink, TabsNav } from "../tabs/tabs.react.tsx";
import { Time } from "../time/time.react.tsx";
import { DraftCompare, DraftPatch } from "../draft-compare/draft-compare.react.tsx";
import { SORTS, STATUS_TABS, contentStatus, countLine, emptyWords, inDays, isoFromLocal, localInputValue, nounsOf, postActions, postsHref, rowActions, withFilter, type RowAction } from "./posts-list.ts";

export { contentStatus };
export type { ContentLabels, IntentResult, PostRow, PostsData, ScheduledUpdateView, SubmitIntent };

export type { FormComponent };

export interface PostsListProps {
  // The loader's view data: one page of one site.
  data: PostsData;
  // Where the forms post, and the list's own address: usually the route itself.
  action: string;
  // The host router's form component. Without it a plain <form> is rendered.
  Form?: FormComponent;
  // The script path: posts a form and resolves with the action's result (a useFetcher wrapper).
  // With it, outcomes, Undo and the confirm dialog happen in place; without it every form posts
  // and the page comes back with `result`.
  submit?: SubmitIntent;
  // The last result from the action, for the page that comes back after a post with no script.
  result?: IntentResult | null;
  labels?: ContentLabels;
  // A fixed "now" for the times and "in 3 days", for a test or a server's clock.
  now?: number;
}

function HeadCheck({ checked, mixed, label, onChange }: { checked: boolean; mixed: boolean; label: string; onChange: (on: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <label className="cap-check">
      <input type="checkbox" ref={ref} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="cap-sr-only">{label}</span>
    </label>
  );
}

// The new time for a reschedule. As delivered it is a text field in UTC that starts at the time
// it moves from ("2030-01-01T15:00:00Z"), since a form with no script cannot add the zone the
// site needs. With script it becomes a date and time field in the person's own zone, and the
// UTC time it means is posted as publishAt.
function RescheduleField({ id, at }: { id: string; at: string }) {
  const [local, setLocal] = useState<string | null>(null);
  useEffect(() => setLocal(localInputValue(at)), [at]);
  if (local === null) {
    return (
      <div className="cap-field">
        <label className="cap-field-label" htmlFor={id}>
          New time, UTC
        </label>
        <input className="cap-input" id={id} name="publishAt" defaultValue={at.replace(/\.\d{3}Z$/, "Z")} autoComplete="off" spellCheck={false} aria-describedby={`${id}-help`} />
        <p className="cap-field-description" id={`${id}-help`}>
          As 2030-01-01T15:00:00Z
        </p>
      </div>
    );
  }
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className="cap-field">
      <label className="cap-field-label" htmlFor={id}>
        New time
      </label>
      <input className="cap-input" type="datetime-local" id={id} value={local} onChange={(e) => setLocal(e.target.value)} aria-describedby={`${id}-help`} />
      <input type="hidden" name="publishAt" value={isoFromLocal(local)} />
      <p className="cap-field-description" id={`${id}-help`}>
        Your time zone, {zone}
      </p>
    </div>
  );
}

// A row's menu items, with the reschedule's time field.
function menuItems(items: RowAction[], fieldId: string) {
  return items.map(({ publishAt, ...item }) => (publishAt ? { ...item, field: <RescheduleField id={fieldId} at={publishAt} /> } : item));
}

// One page of one site's posts: status tabs with counts, search and filters, the table with its
// row menus, the bulk bar with each item's outcome, Undo, and the confirmation for what cannot be
// undone. Every action is a form post, so it all works with no script; `submit` adds the in-place
// path. The site and the person decide what is offered (data.offers, data.can).
export function PostsList({ data, action, Form = PlainForm, submit, result = null, labels, now }: PostsListProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const formId = `${uid}-bulk`;
  const { noun, plural } = nounsOf(labels);
  const title = plural.charAt(0).toUpperCase() + plural.slice(1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const clock = now ?? Date.now();

  const { rows, query, page, offers, can } = data;
  const { bulk, withheld } = postActions(data, labels);
  const selectable = bulk.length > 0;
  const names = useMemo(() => new Map(rows.map((r) => [r.id, r.title || "Untitled"])), [rows]);
  const tags = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.tags ?? []))).sort(), [rows]);
  const withMenus = rows.some((r) => rowActions(r, data).length > 0);

  const [selected, setSelected] = useState<string[]>([]);
  // A new page or filter keeps only what is still in view.
  useEffect(() => setSelected((s) => s.filter((id) => names.has(id))), [names]);
  const href = (q: typeof query) => postsHref(action, q);
  const intents = useIntents({ action, Form, submit, result, names, cancelHref: href(query), onDone: () => setSelected([]) });
  if (intents.confirmPage) {
    return (
      <section className="cap-posts" data-cap="posts-list" aria-label={title}>
        {intents.confirmPage}
      </section>
    );
  }

  const selectedItems = rows.filter((r) => selected.includes(r.id)).map((r) => ({ id: r.id, label: r.title || "Untitled" }));
  const setOne = (id: string, on: boolean) => setSelected((s) => (on ? (s.includes(id) ? s : [...s, id]) : s.filter((x) => x !== id)));
  const setAll = (on: boolean) => setSelected(on ? rows.map((r) => r.id) : []);
  const onTableKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && selected.length > 0 && !e.defaultPrevented) {
      e.preventDefault();
      setSelected([]);
    }
  };
  const empty = rows.length === 0;
  const words = emptyWords(query, labels);
  const count = (s: string | undefined) => data.counts?.[(s ?? "all") as keyof NonNullable<PostsData["counts"]>];
  const extraColumns = data.extra?.columns ?? [];

  return (
    <section className="cap-posts" data-cap="posts-list" aria-label={title} ref={(el) => void (intents.rootRef.current = el)} onSubmit={intents.onSubmit}>
      <TabsNav aria-label={`${title} by status`} className="cap-posts-tabs">
        {STATUS_TABS.map((t) => (
          <TabLink key={t.label} href={href(withFilter(query, { status: t.status }))} current={query.status === t.status} count={count(t.status)}>
            {t.label}
          </TabLink>
        ))}
      </TabsNav>

      <Form method="get" action={action.split("?")[0]} className="cap-posts-filters" role="search" aria-label={`Find ${plural}`}>
        {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
        <div className="cap-field cap-posts-search">
          <label className="cap-field-label" htmlFor={`${uid}-q`}>
            Search
          </label>
          <input className="cap-input" type="search" id={`${uid}-q`} name="q" defaultValue={query.q ?? ""} />
        </div>
        {data.kinds.length > 1 ? (
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${uid}-kind`}>
              Kind
            </label>
            <div className="cap-select-wrap" data-native="">
              <select className="cap-select" id={`${uid}-kind`} name="kind" defaultValue={query.kind ?? ""}>
                <option value="">Any kind</option>
                {data.kinds.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
        {tags.length > 0 || query.tag ? (
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${uid}-tag`}>
              Tag
            </label>
            <div className="cap-select-wrap" data-native="">
              <select className="cap-select" id={`${uid}-tag`} name="tag" defaultValue={query.tag ?? ""}>
                <option value="">Any tag</option>
                {Array.from(new Set([...tags, ...(query.tag ? [query.tag] : [])])).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={`${uid}-sort`}>
            Sort by
          </label>
          <div className="cap-select-wrap" data-native="">
            <select className="cap-select" id={`${uid}-sort`} name="sort" defaultValue={query.sort ?? "updated"}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="cap-btn">
          Show
        </button>
      </Form>

      <div className="cap-posts-bar">
        {empty ? <span /> : <p className="cap-posts-count">{countLine(data, labels)}</p>}
        <div className="cap-posts-tools">
          {data.extra?.toolbar?.length ? (
            <Form method="post" action={action} className="cap-posts-extra">
              {data.extra.toolbar.map((a) => (
                <button key={a.intent} type="submit" className="cap-btn" name="intent" value={a.intent}>
                  {a.label}
                </button>
              ))}
            </Form>
          ) : null}
          {can.edit && data.newHref ? (
            <a className="cap-btn" data-variant="primary" href={data.newHref}>
              New {noun}
            </a>
          ) : null}
        </div>
      </div>

      {withheld.length ? (
        <ul className="cap-posts-withheld">
          {withheld.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {intents.resultBox}

      {selectable ? (
        <ContentBulkBar formId={formId} action={action} Form={Form} formClass="cap-posts-bulk-form" items={selectedItems} total={rows.length} onSelectAll={mounted ? () => setAll(true) : undefined} onClear={() => setSelected([])} plural={plural} actions={bulk} tag={offers.tags && can.edit} intents={intents} />
      ) : null}

      {empty ? (
        <Empty
          kind={words.kind}
          title={words.title}
          action={
            words.kind === "no-match" ? (
              <a className="cap-btn" href={href(withFilter(query, { q: undefined, kind: undefined, tag: undefined }))}>
                Clear filters
              </a>
            ) : !query.status && can.edit && data.newHref ? (
              <a className="cap-btn" data-variant="primary" href={data.newHref}>
                New {noun}
              </a>
            ) : undefined
          }
        >
          {words.text}
        </Empty>
      ) : (
        <div className="cap-table-wrap cap-posts-wrap" role="region" aria-labelledby={`${uid}-cap`} tabIndex={0} onKeyDown={onTableKey}>
          <table className="cap-table cap-posts-table">
            <caption id={`${uid}-cap`} className="cap-sr-only">
              {title} on {data.site.name}
            </caption>
            <thead>
              <tr>
                {selectable ? (
                  <th scope="col" className="cap-posts-check">
                    {mounted ? <HeadCheck checked={selected.length > 0 && selected.length === rows.length} mixed={selected.length > 0 && selected.length < rows.length} label={`Select all ${rows.length} ${rows.length === 1 ? noun : plural}`} onChange={setAll} /> : <span className="cap-sr-only">Select</span>}
                  </th>
                ) : null}
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
                {extraColumns.map((c) => (
                  <th key={c.id} scope="col">
                    {c.label}
                  </th>
                ))}
                {withMenus ? (
                  <th scope="col">
                    <span className="cap-sr-only">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const st = contentStatus(row.status, row.publishAt, clock);
                const name = row.title || "Untitled";
                const items = rowActions(row, data);
                return (
                  <tr key={row.id} data-status={row.status} data-selected={selected.includes(row.id) ? "" : undefined}>
                    {selectable ? (
                      <td className="cap-posts-check">
                        <label className="cap-check">
                          <input type="checkbox" name="ids" value={row.id} form={formId} checked={selected.includes(row.id)} onChange={(e) => setOne(row.id, e.target.checked)} />
                          <span className="cap-sr-only">Select {name}</span>
                        </label>
                      </td>
                    ) : null}
                    <th scope="row" className="cap-posts-title">
                      <a className="cap-table-open" href={row.href}>
                        {name}
                      </a>
                      <span className="cap-posts-meta">
                        <span className="cap-posts-path">{row.path ?? "Not on the site yet"}</span>
                        {data.kinds.length > 1 ? <span className="cap-posts-kind">{row.kind}</span> : null}
                      </span>
                      {row.notes?.length ? (
                        <span className="cap-posts-notes">
                          {row.notes.map((n) =>
                            n.tone ? (
                              <Pill key={n.text} tone={n.tone}>
                                {n.text}
                              </Pill>
                            ) : (
                              <Pill key={n.text} variant="secondary">
                                {n.text}
                              </Pill>
                            ),
                          )}
                        </span>
                      ) : null}
                    </th>
                    <td className="cap-posts-status">
                      <Status tone={st.tone}>{st.word}</Status>
                      {st.when ? (
                        <>
                          {" "}
                          <span className="cap-posts-when">{st.when}</span>
                        </>
                      ) : null}
                      {row.status === "published" && row.scheduledUpdate ? (
                        <span className="cap-posts-update">
                          <Status tone="info">Update scheduled</Status> <span className="cap-posts-when">{inDays(row.scheduledUpdate.publishAt, clock)}</span>
                        </span>
                      ) : null}
                    </td>
                    <td className="cap-posts-updated">{row.updatedAt ? <Time at={row.updatedAt} now={now} /> : <span className="cap-posts-none">No date</span>}</td>
                    {extraColumns.map((c) => (
                      <td key={c.id}>{c.cells[row.id] ?? ""}</td>
                    ))}
                    {withMenus ? (
                      <td className="cap-posts-actions">
                        {items.length ? <FormMenu label="Actions" aria-label={`Actions for ${name}`} action={action} hidden={{ ids: row.id }} items={menuItems(items, `${uid}-${row.id}-at`)} /> : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {query.cursor || page.nextCursor ? (
        <nav className="cap-posts-pages" aria-label={`${title} pages`}>
          {query.cursor ? (
            <a className="cap-btn" href={href(withFilter(query, {}))}>
              First page
            </a>
          ) : null}
          {page.nextCursor ? (
            <a className="cap-btn" href={href({ ...query, cursor: page.nextCursor })}>
              Next page
            </a>
          ) : null}
        </nav>
      ) : null}

      {intents.confirmDialog}
    </section>
  );
}

export interface PostScheduledUpdateProps {
  // site-api's loadScheduledUpdate(source, id): the update's source, the live one, the patch and
  // the time in words.
  data: ScheduledUpdateView;
  // Where Reschedule and Cancel post: the posts list's action, which runs the kit's intents.
  action: string;
  Form?: FormComponent;
  submit?: SubmitIntent;
  result?: IntentResult | null;
  // Where the person goes back to: the posts list.
  backHref?: string;
  labels?: ContentLabels;
  now?: number;
}

// The update waiting on a live post: when it goes live, its source beside the live one (the
// draft compare, with the unified patch under it), and Reschedule and Cancel, posting the posts
// list's own intents.
export function PostScheduledUpdate({ data, action, Form = PlainForm, submit, result = null, backHref, labels, now }: PostScheduledUpdateProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { noun } = nounsOf(labels);
  const name = data.title || "Untitled";
  const names = useMemo(() => new Map([[data.id, name]]), [data.id, name]);
  const intents = useIntents({ action, Form, submit, result, names, cancelHref: backHref ?? action });
  const clock = now ?? Date.now();
  return (
    <section className="cap-posts-update-view" data-cap="posts-list" aria-labelledby={`${uid}-h`} ref={(el) => void (intents.rootRef.current = el)} onSubmit={intents.onSubmit}>
      <header className="cap-posts-update-head">
        <h2 id={`${uid}-h`}>Update scheduled for {name}</h2>
        <p className="cap-posts-update-when">
          <Status tone="info">Goes live {data.when}</Status> <span className="cap-posts-when">{inDays(data.publishAt, clock)}</span>
        </p>
        <p className="cap-posts-update-note">
          Until then the site serves the live {noun}. At that time this update replaces it whole, so a change saved to the live {noun} meanwhile is lost unless it is made here too. Scheduled <Time at={data.scheduledAt} now={now} />.
        </p>
        <div className="cap-posts-update-links">
          {backHref ? (
            <a className="cap-btn" href={backHref}>
              Back to the list
            </a>
          ) : null}
          {data.can.edit ? (
            <a className="cap-btn" href={data.editorHref}>
              Edit the update
            </a>
          ) : null}
          {data.live.href ? (
            <a className="cap-btn" href={data.live.href}>
              View the live {noun}
            </a>
          ) : null}
        </div>
      </header>

      {intents.resultBox}

      {data.can.publish ? (
        <Form method="post" action={action} className="cap-posts-update-form">
          <input type="hidden" name="ids" value={data.id} />
          <input type="hidden" name="versions" value={data.live.version} />
          <RescheduleField id={`${uid}-at`} at={data.publishAt} />
          <div className="cap-posts-update-actions">
            <button type="submit" className="cap-btn" data-variant="primary" name="intent" value="reschedule">
              Reschedule
            </button>
            <button type="submit" className="cap-btn" name="intent" value="cancel-schedule">
              Cancel the update
            </button>
          </div>
        </Form>
      ) : (
        <p className="cap-posts-withheld">Rescheduling or canceling it needs a publisher's role.</p>
      )}

      <DraftCompare before={{ title: `Live ${noun}`, text: data.live.source }} after={{ title: "Scheduled update", time: data.scheduledAt, text: data.source }} labels={{ before: "Live", after: "Scheduled" }} id={`${uid}-cmp`} />
      <details className="cap-posts-update-patch">
        <summary>The change as a patch</summary>
        <DraftPatch patch={data.patch} title={`The scheduled update to ${name}`} id={`${uid}-patch`} />
      </details>

      {intents.confirmDialog}
    </section>
  );
}
