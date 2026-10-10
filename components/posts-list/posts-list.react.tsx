import { useEffect, useId, useMemo, useRef, useState, type ComponentType, type FormEvent, type FormHTMLAttributes, type KeyboardEvent } from "react";
import { BulkBar, type BulkOutcome } from "../bulk-bar/bulk-bar.react.tsx";
import { ConfirmDialog, ConfirmPage } from "../confirm-dialog/confirm-dialog.react.tsx";
import type { ConfirmRequest, ContentLabels, IntentResult, PostRow, PostsData, SubmitIntent } from "../content/content.ts";
import { Empty } from "../empty/empty.react.tsx";
import { FormMenu } from "../menu/menu.react.tsx";
import { useOptionalMessage } from "../message/message.react.tsx";
import { GLYPHS, isUndoKey } from "../message/message.ts";
import { Pill, Status } from "../status/status.react.tsx";
import { TabLink, TabsNav } from "../tabs/tabs.react.tsx";
import { Time } from "../time/time.react.tsx";
import { SORTS, STATUS_TABS, contentStatus, countLine, emptyWords, intentForm, nounsOf, outcomesOf, postActions, postsHref, rowActions, withFilter } from "./posts-list.ts";

export { contentStatus };
export type { ContentLabels, IntentResult, PostRow, PostsData, SubmitIntent };

// The host router's form (React Router's <Form>), so a filter or a post stays in the app. Given
// the props a plain <form> takes.
export type FormComponent = ComponentType<FormHTMLAttributes<HTMLFormElement> & { method?: "get" | "post" }>;

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

const PlainForm: FormComponent = (props) => <form {...props} />;

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

// The result of the last action, in the page: the sentence, and Undo as a form that posts the
// inverse, so it works with no script. With script the list's submit handler catches that post.
function ResultBox({ result, action, Form, keyHint }: { result: IntentResult | null; action: string; Form: FormComponent; keyHint: boolean }) {
  const kind = result ? (result.ok ? "ok" : "failure") : null;
  return (
    <div className="cap-message cap-posts-result" role="status" aria-label="Results and failures" aria-atomic="false">
      {result && kind ? (
        <div className="cap-message-item" data-cap-part="item" data-kind={kind} data-lasting={result.ok ? undefined : ""}>
          <svg className="cap-message-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: GLYPHS[kind] }} />
          <p className="cap-message-text" data-cap-part="text">
            <span data-cap-part="said" role={result.ok ? undefined : "alert"}>
              {result.message}
            </span>
          </p>
          {result.undo ? (
            <Form method="post" action={action} className="cap-posts-undo">
              {Object.entries(result.undo.fields).flatMap(([k, v]) => (k === "intent" ? [] : (typeof v === "string" ? [v] : v).map((one, i) => <input key={`${k}-${i}`} type="hidden" name={k} value={one} />)))}
              <button type="submit" className="cap-link-btn cap-message-undo" data-cap-part="undo" name="intent" value={result.undo.intent}>
                <span>Undo</span>
                {keyHint ? (
                  <>
                    {" "}
                    <kbd aria-hidden="true">z</kbd>
                  </>
                ) : null}
              </button>
            </Form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
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
  const message = useOptionalMessage();
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
  const [outcomes, setOutcomes] = useState<BulkOutcome[]>(() => (result ? outcomesOf(result, names) : []));
  // The last result the script path got. It replaces `result` (which came with the page) until
  // the page brings a new one.
  const [settled, setSettled] = useState<IntentResult | null>(null);
  useEffect(() => {
    setSettled(null);
    setOutcomes(result ? outcomesOf(result, names) : []);
    // Only a new result from the page resets these, not a new page of rows.
  }, [result]);
  const [asking, setAsking] = useState<ConfirmRequest | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // What the list's own result box says: the page's result, or with no message region on the
  // page, the script path's too.
  const box = settled ? (message ? null : settled) : result;

  const announce = (r: IntentResult) => {
    setSettled(r);
    if (!message) return;
    const inverse = r.undo;
    // A result with nothing to undo that failed is a failure; one that did part of its work
    // still offers Undo for that part, and the bar lists what was refused.
    if (!r.ok && !inverse) return message.fail(r.message);
    message.say(r.message, {
      undo:
        inverse && submit
          ? async () => {
              const u = await submit(intentForm(inverse.intent, inverse.fields));
              if (!u.ok) throw new Error(u.message);
              // The Undo's own result replaces the message it came from.
              message.say(u.message);
            }
          : undefined,
    });
  };

  const handle = (r: IntentResult, labelsAtPost: ReadonlyMap<string, string>) => {
    if (r.confirm) return setAsking(r.confirm);
    const list = outcomesOf(r, labelsAtPost);
    setOutcomes(list.length > 1 || list.some((o) => !o.ok) ? list : []);
    if (r.ok || list.some((o) => o.ok)) setSelected([]);
    announce(r);
  };

  const run = async (form: FormData) => {
    if (!submit) return;
    const at = new Map(names);
    let r: IntentResult;
    try {
      r = await submit(form);
    } catch (err) {
      const why = err instanceof Error && err.message ? err.message : "the site did not answer";
      const failed: IntentResult = { ok: false, message: `Not done: ${why}. Nothing was changed.` };
      return announce(failed);
    }
    handle(r, at);
  };

  // With script, every post from inside the list goes through `submit` instead of a page load:
  // the bulk bar, a row menu, Undo, a host action. A GET (the filters) navigates as before.
  const onSubmit = (e: FormEvent<HTMLElement>) => {
    if (!submit || !(e.target instanceof HTMLFormElement) || e.target.method.toLowerCase() !== "post") return;
    e.preventDefault();
    const form = e.target;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(form, submitter instanceof HTMLButtonElement ? submitter : null);
    form.closest("details")?.removeAttribute("open");
    void run(data);
  };

  // z runs Undo when the list's script path says its own results (the message region does it
  // otherwise).
  const undoForm = !!submit && !message && mounted && !!box?.undo;
  useEffect(() => {
    if (!undoForm) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || !isUndoKey(e)) return;
      const button = sectionRef.current?.querySelector<HTMLButtonElement>(".cap-posts-undo [data-cap-part='undo']");
      if (!button) return;
      e.preventDefault();
      button.form?.requestSubmit(button);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undoForm]);

  const base = action;
  const href = (q: typeof query) => postsHref(base, q);

  // The action asked first, so the page is its confirmation: with no script this is how a
  // delete is confirmed. With script the same form posts through `submit`.
  if (!settled && result?.confirm) {
    const c = result.confirm;
    return (
      <section className="cap-posts" data-cap="posts-list" aria-label={title}>
        <ConfirmPage action={action} hidden={{ intent: c.intent, ...c.fields }} title={c.title} lead={c.lead} body={c.items} action_label={c.action} cancelHref={href(query)} typeToConfirm={c.typeToConfirm} headingLevel="h2" />
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
    <section className="cap-posts" data-cap="posts-list" aria-label={title} ref={sectionRef} onSubmit={onSubmit}>
      <TabsNav aria-label={`${title} by status`} className="cap-posts-tabs">
        {STATUS_TABS.map((t) => (
          <TabLink key={t.label} href={href(withFilter(query, { status: t.status }))} current={query.status === t.status} count={count(t.status)}>
            {t.label}
          </TabLink>
        ))}
      </TabsNav>

      <Form method="get" action={base.split("?")[0]} className="cap-posts-filters" role="search" aria-label={`Find ${plural}`}>
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

      {!message || box ? <ResultBox result={box} action={action} Form={Form} keyHint={undoForm} /> : null}

      {selectable ? (
        <>
          <Form id={formId} method="post" action={action} className="cap-posts-bulk-form" />
          <BulkBar
            form={formId}
            position="top"
            items={selectedItems}
            total={rows.length}
            onSelectAll={mounted ? () => setAll(true) : undefined}
            onClear={() => setSelected([])}
            label={`Bulk actions on ${plural}`}
            prompt={`Tick the ${plural} to act on`}
            actions={bulk.map((a) => ({ id: a.intent, label: a.label, destructive: a.destructive, submit: true }))}
            outcomes={outcomes}
            onDismissOutcomes={() => setOutcomes([])}
          >
            {offers.tags && can.edit ? (
              <span className="cap-bulk-field">
                <label htmlFor={`${uid}-tagname`}>Tag</label>
                <input className="cap-input" id={`${uid}-tagname`} name="tag" form={formId} autoComplete="off" />
              </span>
            ) : null}
          </BulkBar>
        </>
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
                    </td>
                    <td className="cap-posts-updated">{row.updatedAt ? <Time at={row.updatedAt} now={now} /> : <span className="cap-posts-none">No date</span>}</td>
                    {extraColumns.map((c) => (
                      <td key={c.id}>{c.cells[row.id] ?? ""}</td>
                    ))}
                    {withMenus ? (
                      <td className="cap-posts-actions">
                        {items.length ? <FormMenu label="Actions" aria-label={`Actions for ${name}`} action={action} hidden={{ ids: row.id }} items={items} /> : null}
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

      {asking ? (
        <ConfirmDialog
          open
          title={asking.title}
          lead={asking.lead}
          body={asking.items}
          action={asking.action}
          typeToConfirm={asking.typeToConfirm}
          perform={async () => {
            if (!submit) return;
            const at = new Map(names);
            const fields = asking.typeToConfirm ? { ...asking.fields, confirm: asking.typeToConfirm } : asking.fields;
            const r = await submit(intentForm(asking.intent, fields));
            // Nothing done at all stays in the dialog with the reason and Try again.
            if (!r.ok && !(r.outcomes ?? []).some((o) => o.ok)) throw new Error(r.message);
            handle({ ...r, confirm: undefined }, at);
          }}
          onClose={() => setAsking(null)}
        />
      ) : null}
    </section>
  );
}
