import { useEffect, useId, useMemo, useRef, useState, type FocusEvent, type FormEvent, type KeyboardEvent } from "react";
import type { ContentLabels, IntentResult, PostRow, PostsData, ScheduledUpdateView, SubmitIntent } from "../content/content.ts";
import { ContentBulkBar, PlainForm, useIntents, type FormComponent } from "../content/content.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { FormMenu } from "../menu/menu.react.tsx";
import { Pill, Status } from "../status/status.react.tsx";
import { TabLink, TabsNav } from "../tabs/tabs.react.tsx";
import { Time } from "../time/time.react.tsx";
import { Dialog, DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../dialog/dialog.react.tsx";
import { DraftCompare, DraftPatch } from "../draft-compare/draft-compare.react.tsx";
import { PageHead } from "../page-head/page-head.react.tsx";
import { copyText } from "../media/media-actions.ts";
import { NO_FILTERS, SORTS, STATUS_TABS, authorLine, contentStatus, countLine, emptyWords, filtered, inDays, isoFromLocal, localInputValue, nounsOf, postActions, postsHref, rowActions, rowStatus, trashLine, withFilter, type RowAction } from "./posts-list.ts";
import type { ConfirmRequest } from "../content/content.ts";

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

// The new time for a reschedule, in the person's own zone; the UTC time it means is posted as
// publishAt. As delivered (the update page with no script) it is a text field in UTC that starts
// at the time it moves from, since a form with no script cannot add the zone the site needs.
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
  return (
    <div className="cap-field">
      <label className="cap-field-label" htmlFor={id}>
        New time
      </label>
      <input className="cap-input" type="datetime-local" id={id} value={local} onChange={(e) => setLocal(e.target.value)} aria-describedby={`${id}-help`} required />
      <input type="hidden" name="publishAt" value={isoFromLocal(local)} />
      <p className="cap-field-description" id={`${id}-help`}>
        In your time zone, {Intl.DateTimeFormat().resolvedOptions().timeZone}.
      </p>
    </div>
  );
}

// What Reschedule… is moving: one post, its name and the time it goes out now.
interface Moving {
  id: string;
  name: string;
  at: string;
  version?: string;
}

// The small dialog Reschedule… opens: the time field and Reschedule. Its form posts inside the
// list (or the update page), so the script path runs it like any other intent.
function RescheduleDialog({ moving, action, Form, onClose, now }: { moving: Moving | null; action: string; Form: FormComponent; onClose: () => void; now?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Dialog open={!!moving} onOpenChange={(open) => (open ? undefined : onClose())} size="sm" described>
      {moving ? (
        <>
          <DialogHeader>
            <DialogTitle>Reschedule {moving.name}</DialogTitle>
            <DialogDescription>
              It goes out <Time at={moving.at} format="exact" />. Choose the new time.
            </DialogDescription>
          </DialogHeader>
          <Form method="post" action={action} className="cap-posts-reschedule" onSubmit={() => onClose()}>
            <input type="hidden" name="intent" value="reschedule" />
            <input type="hidden" name="ids" value={moving.id} />
            {moving.version ? <input type="hidden" name="versions" value={moving.version} /> : null}
            <DialogBody>
              <RescheduleField id={`${uid}-at`} at={moving.at} key={moving.id + moving.at} />
            </DialogBody>
            <DialogFooter>
              <DialogClose part="cancel">Close</DialogClose>
              <button type="submit" className="cap-btn" data-variant="primary">
                Reschedule
              </button>
            </DialogFooter>
          </Form>
        </>
      ) : null}
    </Dialog>
  )
}

// What Rename… is moving: one post, its name, its id and the address it has now (null for a post
// never published).
interface Renaming {
  id: string;
  name: string;
  path: string | null;
  version?: string;
}

// A slug as the contract's ContentId takes it ("notes-on-lambda"). The kit checks it again.
const SLUG = "[A-Za-z0-9][A-Za-z0-9._\\-]{0,199}";

// The small dialog Rename… opens (site-api v0.17.0): the new slug, starting at the old one, and
// what happens to the old address. It posts `rename` with `newId` inside the list, as Reschedule does.
function RenameDialog({ renaming, action, Form, onClose }: { renaming: Renaming | null; action: string; Form: FormComponent; onClose: () => void }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Dialog open={!!renaming} onOpenChange={(open) => (open ? undefined : onClose())} size="sm" described>
      {renaming ? (
        <>
          <DialogHeader>
            <DialogTitle>Rename {renaming.name}</DialogTitle>
            <DialogDescription>{renaming.path ? `Its address is ${renaming.path} now. The old address will redirect to the new one, so links to it keep working.` : "It has never been published, so no address changes."}</DialogDescription>
          </DialogHeader>
          <Form method="post" action={action} className="cap-posts-rename" onSubmit={() => onClose()}>
            <input type="hidden" name="intent" value="rename" />
            <input type="hidden" name="ids" value={renaming.id} />
            {renaming.version ? <input type="hidden" name="versions" value={renaming.version} /> : null}
            <DialogBody>
              <div className="cap-field">
                <label className="cap-field-label" htmlFor={`${uid}-slug`}>
                  New slug
                </label>
                <input className="cap-input" id={`${uid}-slug`} name="newId" defaultValue={renaming.id} pattern={SLUG} maxLength={200} required autoComplete="off" spellCheck={false} aria-describedby={`${uid}-slug-help`} />
                <p className="cap-field-description" id={`${uid}-slug-help`}>
                  Letters, digits, dots, dashes and underscores, starting with a letter or a digit.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose part="cancel">Close</DialogClose>
              <button type="submit" className="cap-btn" data-variant="primary">
                Rename
              </button>
            </DialogFooter>
          </Form>
        </>
      ) : null}
    </Dialog>
  );
}

// The preview link the last post made (`preview-link`, site-api v0.17.0): its address in a field
// that selects whole, Copy with script, and when it stops working in the reader's own zone. A status
// region, so the new link and a copy are said where the person is looking.
function PreviewLinkBox({ link, name, noun, scripted }: { link: { url: string; expiresAt: string } | undefined; name?: string; noun: string; scripted: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [copied, setCopied] = useState("");
  useEffect(() => setCopied(""), [link?.url]);
  return (
    <div className="cap-posts-preview" role="status" aria-label="Preview link">
      {link ? (
        <>
          <label className="cap-field-label" htmlFor={`${uid}-url`}>
            {name ? `Preview link for ${name}` : "Preview link"}
          </label>
          <div className="cap-posts-preview-row">
            <input className="cap-input" id={`${uid}-url`} value={link.url} readOnly onFocus={(e) => e.currentTarget.select()} aria-describedby={`${uid}-until`} />
            {scripted ? (
              <button type="button" className="cap-btn" onClick={async () => setCopied((await copyText(link.url)) ? "Copied." : "Could not copy. Select the address and copy it.")}>
                Copy
              </button>
            ) : null}
          </div>
          <p className="cap-field-description" id={`${uid}-until`}>
            Anyone with the link can read the {noun} until <Time at={link.expiresAt} format="exact" />. {copied}
          </p>
        </>
      ) : null}
    </div>
  );
}

// Asks before canceling an update: it has no Undo.
const cancelRequest = (id: string, name: string, noun: string, version?: string): ConfirmRequest => ({
  intent: "cancel-schedule",
  title: `Cancel the scheduled update to ${name}?`,
  lead: `The live ${noun} stays as it is and the update's changes are dropped. This cannot be undone.`,
  action: "Cancel the update",
  cancelLabel: "Keep the update",
  items: [name],
  fields: version ? { ids: [id], versions: [version] } : { ids: [id] },
});

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
  const inTrash = !!(offers.trash && query.trashed);
  const authors = offers.filters?.includes("author") ? Array.from(new Set([...(offers.authors ?? []), ...(query.author ? [query.author] : [])])) : [];
  const dates = !!offers.filters?.includes("published");
  const selectable = bulk.length > 0;
  const names = useMemo(() => new Map(rows.map((r) => [r.id, r.title || "Untitled"])), [rows]);
  const tags = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.tags ?? []))).sort(), [rows]);
  const withMenus = rows.some((r) => rowActions(r, data).length > 0);

  const [selected, setSelected] = useState<string[]>([]);
  // A new page or filter keeps only what is still in view.
  useEffect(() => setSelected((s) => s.filter((id) => names.has(id))), [names]);
  const href = (q: typeof query) => postsHref(action, q);
  const intents = useIntents({ action, Form, submit, result, names, cancelHref: href(query), onDone: () => setSelected([]) });
  const [moving, setMoving] = useState<Moving | null>(null);
  const [renaming, setRenaming] = useState<Renaming | null>(null);
  // Where focus goes when a post leaves the list under it (Move to Trash, Restore, Delete for good,
  // with script): the title of the post that took its place, or of the one before when it was the
  // last; after the bulk bar, the table; with nothing left, the current tab. Never the page's top.
  const lastRow = useRef(-1);
  const placeFocus = useRef<number | null>(null);
  const onFocus = (e: FocusEvent<HTMLElement>) => {
    const tr = e.target.closest("tbody tr");
    lastRow.current = tr?.parentElement ? Array.prototype.indexOf.call(tr.parentElement.children, tr) : -1;
  };
  const onSubmit = (e: FormEvent<HTMLElement>) => {
    if (submit && e.target instanceof HTMLFormElement && e.target.method.toLowerCase() === "post") placeFocus.current = lastRow.current;
    intents.onSubmit(e);
  };
  useEffect(() => {
    const at = placeFocus.current;
    const root = intents.rootRef.current;
    placeFocus.current = null;
    if (at === null || !root) return;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const titles = root.querySelectorAll<HTMLElement>("tbody .cap-table-open");
    const target = at >= 0 && titles.length ? titles[Math.min(at, titles.length - 1)] : root.querySelector<HTMLElement>(titles.length ? ".cap-posts-wrap" : ".cap-posts-tabs [aria-current='page']");
    target?.focus();
  }, [rows, intents.rootRef]);
  // With script, Reschedule… opens the dialog and Cancel the update asks first; with no script
  // their links go to the page that does it.
  const menuItems = (row: PostRow, list: RowAction[]) =>
    list.map(({ publishAt, ...item }) => {
      if (!mounted || !submit) return item;
      const name = row.title || "Untitled";
      if (item.value === "reschedule" && publishAt) return { ...item, onSelect: () => setMoving({ id: row.id, name, at: publishAt, version: row.version }) };
      if (item.value === "cancel-schedule") return { ...item, onSelect: () => intents.ask(cancelRequest(row.id, name, noun, row.version)) };
      if (item.value === "rename") return { ...item, onSelect: () => setRenaming({ id: row.id, name, path: row.path, version: row.version }) };
      return item;
    });
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
  const linked = intents.latest?.previewLink;
  const linkedId = linked ? intents.latest?.outcomes?.[0]?.id : undefined;
  const count = (s: string | undefined) => data.counts?.[(s ?? "all") as keyof NonNullable<PostsData["counts"]>];
  const extraColumns = data.extra?.columns ?? [];

  return (
    <section className="cap-posts" data-cap="posts-list" aria-label={title} ref={(el) => void (intents.rootRef.current = el)} onSubmit={onSubmit} onFocus={onFocus}>
      <TabsNav aria-label={`${title} by status`} className="cap-posts-tabs">
        {STATUS_TABS.map((t) => (
          <TabLink key={t.label} href={href(withFilter(query, { status: t.status, trashed: undefined }))} current={!query.trashed && query.status === t.status} count={count(t.status)}>
            {t.label}
          </TabLink>
        ))}
        {offers.trash ? (
          <TabLink href={href(withFilter(query, { status: undefined, trashed: "1" }))} current={!!query.trashed} count={data.counts?.trash}>
            Trash
          </TabLink>
        ) : null}
      </TabsNav>

      <Form method="get" action={action.split("?")[0]} className="cap-posts-filters" role="search" aria-label={`Find ${plural}`}>
        {query.status && !query.trashed ? <input type="hidden" name="status" value={query.status} /> : null}
        {query.trashed ? <input type="hidden" name="trashed" value="1" /> : null}
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
        {authors.length ? (
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${uid}-author`}>
              Author
            </label>
            <div className="cap-select-wrap" data-native="">
              <select className="cap-select" id={`${uid}-author`} name="author" defaultValue={query.author ?? ""}>
                <option value="">Any author</option>
                {authors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
        {dates ? (
          <>
            <div className="cap-field">
              <label className="cap-field-label" htmlFor={`${uid}-from`}>
                Published from
              </label>
              <input className="cap-input" type="date" id={`${uid}-from`} name="from" defaultValue={query.from ?? ""} />
            </div>
            <div className="cap-field">
              <label className="cap-field-label" htmlFor={`${uid}-to`}>
                Published to
              </label>
              <input className="cap-input" type="date" id={`${uid}-to`} name="to" defaultValue={query.to ?? ""} />
            </div>
          </>
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
        {filtered(query) ? (
          <a className="cap-btn" data-variant="quiet" href={href(withFilter(query, NO_FILTERS))}>
            Clear filters
          </a>
        ) : null}
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

      {inTrash ? <p className="cap-posts-trash-note">{trashLine(labels)}</p> : null}

      {withheld.length ? (
        <ul className="cap-posts-withheld">
          {withheld.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {intents.resultBox}
      {offers.previewLinks ? <PreviewLinkBox link={linked} name={linkedId ? names.get(linkedId) : undefined} noun={noun} scripted={mounted} /> : null}

      {selectable ? (
        <ContentBulkBar formId={formId} action={action} Form={Form} formClass="cap-posts-bulk-form" items={selectedItems} total={rows.length} onSelectAll={mounted ? () => setAll(true) : undefined} onClear={() => setSelected([])} plural={plural} actions={bulk} tag={offers.tags && can.edit && !inTrash} intents={intents} />
      ) : null}

      {empty ? (
        <Empty
          kind={words.kind}
          title={words.title}
          action={
            words.kind === "no-match" ? (
              <a className="cap-btn" href={href(withFilter(query, NO_FILTERS))}>
                Clear filters
              </a>
            ) : !query.status && !query.trashed && can.edit && data.newHref ? (
              <a className="cap-btn" data-variant="primary" href={data.newHref}>
                New {noun}
              </a>
            ) : undefined
          }
        >
          {words.text}
        </Empty>
      ) : (
        <div className="cap-table-wrap cap-posts-wrap" data-reflow="" role="region" aria-labelledby={`${uid}-cap`} tabIndex={0} onKeyDown={onTableKey}>
          <table className="cap-table cap-posts-table">
            <caption id={`${uid}-cap`} className="cap-sr-only">
              {inTrash ? `${title} in Trash` : title} on {data.site.name}
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
                const st = rowStatus(row, clock);
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
                        {row.authors?.length ? <span className="cap-posts-authors">{authorLine(row.authors)}</span> : null}
                      </span>
                      {row.excerpt ? <span className="cap-posts-excerpt">{row.excerpt}</span> : null}
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
                    <td className="cap-posts-status" data-label="Status">
                      <Status tone={st.tone}>{st.word}</Status>
                      {st.note ? <span className="cap-posts-when"> · {st.note}</span> : null}
                    </td>
                    <td className="cap-posts-updated" data-label="Updated">{row.updatedAt ? <Time at={row.updatedAt} now={now} /> : <span className="cap-posts-none">No date</span>}</td>
                    {extraColumns.map((c) => (
                      <td key={c.id} className="cap-posts-extra-cell" data-label={c.label}>
                        {c.cells[row.id] ?? ""}
                      </td>
                    ))}
                    {withMenus ? (
                      <td className="cap-posts-actions">
                        {items.length ? <FormMenu label="Actions" aria-label={`Actions for ${name}`} action={action} hidden={{ ids: row.id }} items={menuItems(row, items)} /> : null}
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

      <RescheduleDialog moving={moving} action={action} Form={Form} onClose={() => setMoving(null)} now={now} />
      <RenameDialog renaming={renaming} action={action} Form={Form} onClose={() => setRenaming(null)} />
      {intents.confirmDialog}
    </section>
  );
}

export interface PostScheduledUpdateProps {
  // site-api's loadScheduledUpdate(source, id): the update's source, the live one, the patch and
  // the times.
  data: ScheduledUpdateView;
  // Where Reschedule and Cancel post: the posts list's action, which runs the kit's intents.
  action: string;
  Form?: FormComponent;
  submit?: SubmitIntent;
  result?: IntentResult | null;
  // When the live version went out (the row's publishedAt), for the live side's heading.
  liveSince?: string | null;
  // The trail above the title: the posts list, then this post.
  crumbs?: Array<{ label: string; href?: string }>;
  // The title's level: the page's h1 by default.
  headingLevel?: "h1" | "h2" | "h3";
  labels?: ContentLabels;
  now?: number;
}

// The page of the update waiting on a live post: a page head with the post's title, when the
// update goes live and its actions, then the update beside the live post in the draft compare,
// with the unified patch under it. Reschedule… opens the dialog and Cancel the update asks
// first, posting the posts list's own intents; with no script both are plain forms under the
// head.
export function PostScheduledUpdate({ data, action, Form = PlainForm, submit, result = null, liveSince, crumbs, headingLevel, labels, now }: PostScheduledUpdateProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { noun } = nounsOf(labels);
  const name = data.title || "Untitled";
  const names = useMemo(() => new Map([[data.id, name]]), [data.id, name]);
  const intents = useIntents({ action, Form, submit, result, names, cancelHref: action });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [moving, setMoving] = useState<Moving | null>(null);
  const clock = now ?? Date.now();
  const scripted = mounted && !!submit;
  const Side = headingLevel === "h3" ? "h4" : headingLevel === "h2" ? "h3" : "h2";
  const may = data.can.publish;
  const actions = (
    <>
      {may && scripted ? (
        <button type="button" className="cap-btn" data-variant="primary" onClick={() => setMoving({ id: data.id, name, at: data.publishAt, version: data.live.version })}>
          Reschedule…
        </button>
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
      {may && scripted ? (
        <button type="button" className="cap-btn" data-variant="danger" data-cap-part="cancel-update" onClick={() => intents.ask(cancelRequest(data.id, name, noun, data.live.version))}>
          Cancel the update
        </button>
      ) : null}
    </>
  );
  return (
    <section className="cap-posts-update-view" data-cap="posts-list" aria-labelledby={`${uid}-h`} ref={(el) => void (intents.rootRef.current = el)} onSubmit={intents.onSubmit}>
      <PageHead
        crumbs={crumbs}
        headingLevel={headingLevel}
        title={<span id={`${uid}-h`}>{name}</span>}
        lead={
          <>
            The update goes live <Time at={data.publishAt} format="exact" />, {inDays(data.publishAt, clock)}. Until then the site serves the live {noun}; then the update replaces it whole.
          </>
        }
        actions={actions}
      />

      {intents.resultBox}

      {may && !scripted ? (
        <Form method="post" action={action} className="cap-posts-update-form">
          <input type="hidden" name="ids" value={data.id} />
          <input type="hidden" name="versions" value={data.live.version} />
          <RescheduleField id={`${uid}-at`} at={data.publishAt} />
          <button type="submit" className="cap-btn" data-variant="primary" name="intent" value="reschedule">
            Reschedule
          </button>
          <button type="submit" className="cap-btn" data-variant="danger" name="intent" value="cancel-schedule">
            Cancel the update
          </button>
        </Form>
      ) : null}
      {!may ? <p className="cap-posts-withheld">Rescheduling or canceling it needs a publisher's role.</p> : null}

      <div className="cap-posts-update-sides">
        <Side className="cap-posts-update-side">
          Live {noun}
          {liveSince ? (
            <span className="cap-posts-update-side-when">
              {" "}
              · on the site since <Time at={liveSince} format="exact" />
            </span>
          ) : null}
        </Side>
        <Side className="cap-posts-update-side">
          Scheduled update
          <span className="cap-posts-update-side-when">
            {" "}
            · goes live <Time at={data.publishAt} format="exact" />
          </span>
        </Side>
      </div>
      <DraftCompare before={{ title: `Live ${noun}`, text: data.live.source }} after={{ title: "Scheduled update", text: data.source }} labels={{ before: "Live", after: "Scheduled" }} id={`${uid}-cmp`} heads={false} />
      <details className="cap-disclosure cap-posts-update-patch">
        <summary>The change as a patch</summary>
        <DraftPatch patch={data.patch} title={`The scheduled update to ${name}`} id={`${uid}-patch`} />
      </details>

      <RescheduleDialog moving={moving} action={action} Form={Form} onClose={() => setMoving(null)} now={now} />
      {intents.confirmDialog}
    </section>
  );
}
