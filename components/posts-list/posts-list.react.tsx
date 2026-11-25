import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  nounsOf,
  type ContentLabels,
  type IntentResult,
  type PostRow,
  type PostsData,
  type ScheduledUpdateView,
  type SubmitIntent,
} from "../content/content.ts";
import { ContentBulkBar, useIntents } from "../content/content.react.tsx";
import { PlainForm, type FormComponent } from "../plain-form/plain-form.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { TabLink, TabsNav } from "../tabs/tabs.react.tsx";
import {
  NO_FILTERS,
  STATUS_TABS,
  contentStatus,
  countLine,
  emptyWords,
  postActions,
  postsHref,
  trashLine,
  withFilter,
  type RowAction,
} from "./posts-list.ts";
import { useCleanId, useHydrated } from "../hooks/hooks.react.tsx";
import { PostsFind } from "./posts-list-find.react.tsx";
import { PostsTable } from "./posts-list-table.react.tsx";
import {
  PreviewLinkBox,
  RenameDialog,
  RescheduleDialog,
  cancelRequest,
  type Moving,
  type Renaming,
} from "./posts-list-dialogs.react.tsx";
export { PostScheduledUpdate, type PostScheduledUpdateProps } from "./posts-list-update.react.tsx";

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

// One page of one site's posts: status tabs with counts, search and filters, the table with its
// row menus, the bulk bar with each item's outcome, Undo, and the confirmation for what cannot be
// undone. Every action is a form post, so it all works with no script; `submit` adds the in-place
// path. The site and the person decide what is offered (data.offers, data.can).
export function PostsList({
  data,
  action,
  Form = PlainForm,
  submit,
  result = null,
  labels,
  now,
}: PostsListProps) {
  const uid = useCleanId();
  const formId = `${uid}-bulk`;
  const { noun, plural } = nounsOf(labels, "post");
  const title = plural.charAt(0).toUpperCase() + plural.slice(1);
  // False on the server and while hydrating, true once hydrated.
  const mounted = useHydrated();
  // The time the list was drawn, when the page does not pass one.
  const [drawnAt] = useState(() => Date.now());
  const clock = now ?? drawnAt;

  const { rows, query, page, offers, can } = data;
  const { bulk, withheld } = postActions(data, labels);
  const inTrash = !!(offers.trash && query.trashed);
  const authors = offers.filters?.includes("author")
    ? Array.from(new Set([...(offers.authors ?? []), ...(query.author ? [query.author] : [])]))
    : [];
  const dates = !!offers.filters?.includes("published");
  const selectable = bulk.length > 0;
  const names = useMemo(() => new Map(rows.map((r) => [r.id, r.title || "Untitled"])), [rows]);
  const tags = useMemo(() => Array.from(new Set(rows.flatMap((r) => r.tags ?? []))).sort(), [rows]);

  const [selected, setSelected] = useState<string[]>([]);
  // A new page or filter keeps only what is still in view, in the same render.
  const [pickedFrom, setPickedFrom] = useState(names);
  if (names !== pickedFrom) {
    setPickedFrom(names);
    setSelected((s) => s.filter((id) => names.has(id)));
  }
  const href = (q: typeof query) => postsHref(action, q);
  const intents = useIntents({
    action,
    Form,
    submit,
    result,
    names,
    cancelHref: href(query),
    onDone: () => setSelected([]),
  });
  const [moving, setMoving] = useState<Moving | null>(null);
  const [renaming, setRenaming] = useState<Renaming | null>(null);
  // Where focus goes when a post leaves the list under it (Move to Trash, Restore, Delete for good,
  // with script): the title of the post that took its place, or of the one before when it was the
  // last; after the bulk bar, the table; with nothing left, the current tab. Never the page's top.
  const lastRow = useRef(-1);
  const placeFocus = useRef<number | null>(null);
  const onFocus = (e: FocusEvent<HTMLElement>) => {
    const tr = e.target.closest("tbody tr");
    lastRow.current = tr?.parentElement
      ? Array.prototype.indexOf.call(tr.parentElement.children, tr)
      : -1;
  };
  const onSubmit = (e: FormEvent<HTMLElement>) => {
    if (submit && e.target instanceof HTMLFormElement && e.target.method.toLowerCase() === "post")
      placeFocus.current = lastRow.current;
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
    const target =
      at >= 0 && titles.length
        ? titles[Math.min(at, titles.length - 1)]
        : root.querySelector<HTMLElement>(
            titles.length ? ".cap-posts-wrap" : ".cap-posts-tabs [aria-current='page']",
          );
    target?.focus();
  }, [rows, intents.rootRef]);
  // With script, Reschedule… opens the dialog and Cancel the update asks first; with no script
  // their links go to the page that does it.
  const menuItems = (row: PostRow, list: RowAction[]) =>
    list.map(({ publishAt, ...item }) => {
      if (!mounted || !submit) return item;
      const name = row.title || "Untitled";
      if (item.value === "reschedule" && publishAt)
        return {
          ...item,
          onSelect: () => setMoving({ id: row.id, name, at: publishAt, version: row.version }),
        };
      if (item.value === "cancel-schedule")
        return {
          ...item,
          onSelect: () => intents.ask(cancelRequest(row.id, name, noun, row.version)),
        };
      if (item.value === "rename")
        return {
          ...item,
          onSelect: () => setRenaming({ id: row.id, name, path: row.path, version: row.version }),
        };
      return item;
    });
  if (intents.confirmPage) {
    return (
      <section className="cap-posts" data-cap="posts-list" aria-label={title}>
        {intents.confirmPage}
      </section>
    );
  }

  const selectedItems = rows
    .filter((r) => selected.includes(r.id))
    .map((r) => ({ id: r.id, label: r.title || "Untitled" }));
  const setOne = (id: string, on: boolean) =>
    setSelected((s) => (on ? (s.includes(id) ? s : [...s, id]) : s.filter((x) => x !== id)));
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
  const count = (s: string | undefined) =>
    data.counts?.[(s ?? "all") as keyof NonNullable<PostsData["counts"]>];

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- delegates the events of the controls inside it
    <section
      className="cap-posts"
      data-cap="posts-list"
      aria-label={title}
      ref={intents.setRoot}
      onSubmit={onSubmit}
      onFocus={onFocus}
    >
      <TabsNav aria-label={`${title} by status`} className="cap-posts-tabs">
        {STATUS_TABS.map((t) => (
          <TabLink
            key={t.label}
            href={href(withFilter(query, { status: t.status, trashed: undefined }))}
            current={!query.trashed && query.status === t.status}
            count={count(t.status)}
          >
            {t.label}
          </TabLink>
        ))}
        {offers.trash ? (
          <TabLink
            href={href(withFilter(query, { status: undefined, trashed: "1" }))}
            current={!!query.trashed}
            count={data.counts?.trash}
          >
            Trash
          </TabLink>
        ) : null}
      </TabsNav>

      <PostsFind
        uid={uid}
        query={query}
        kinds={data.kinds}
        tags={tags}
        authors={authors}
        dates={dates}
        action={action}
        Form={Form}
        plural={plural}
        href={href}
      />

      <div className="cap-posts-bar">
        {empty ? <span /> : <p className="cap-posts-count">{countLine(data, labels)}</p>}
        <div className="cap-posts-tools">
          {data.extra?.toolbar?.length ? (
            <Form method="post" action={action} className="cap-posts-extra">
              {data.extra.toolbar.map((a) => (
                <button
                  key={a.intent}
                  type="submit"
                  className="cap-btn"
                  name="intent"
                  value={a.intent}
                >
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

      {/* oxlint-disable-next-line react/refs -- intents holds the root ref for its handlers; rendering reads none of it */}
      {intents.resultBox}
      {offers.previewLinks ? (
        <PreviewLinkBox
          link={linked}
          name={linkedId ? names.get(linkedId) : undefined}
          noun={noun}
          scripted={mounted}
        />
      ) : null}

      {selectable ? (
        <ContentBulkBar
          formId={formId}
          action={action}
          Form={Form}
          formClass="cap-posts-bulk-form"
          items={selectedItems}
          total={rows.length}
          onSelectAll={mounted ? () => setAll(true) : undefined}
          onClear={() => setSelected([])}
          plural={plural}
          actions={bulk}
          tag={offers.tags && can.edit && !inTrash}
          intents={intents}
        />
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
        />
      ) : (
        <PostsTable
          uid={uid}
          data={data}
          action={action}
          title={title}
          noun={noun}
          plural={plural}
          formId={formId}
          inTrash={inTrash}
          selectable={selectable}
          mounted={mounted}
          selected={selected}
          setOne={setOne}
          setAll={setAll}
          onKeyDown={onTableKey}
          clock={clock}
          now={now}
          menuItems={menuItems}
        />
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

      <RescheduleDialog
        moving={moving}
        action={action}
        Form={Form}
        onClose={() => setMoving(null)}
      />
      <RenameDialog
        renaming={renaming}
        action={action}
        Form={Form}
        onClose={() => setRenaming(null)}
      />
      {intents.confirmDialog}
    </section>
  );
}
