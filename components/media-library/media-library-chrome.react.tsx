import { type MediaQuery } from "../content/content.ts";
import { Disclosure } from "../disclosure/disclosure.react.tsx";
import { Keys } from "../shortcuts/shortcuts.react.tsx";
import { TabLink, TabsNav } from "../tabs/tabs.react.tsx";
import {
  countLine,
  KIND_WORDS,
  ORIENTATION_WORDS,
  SORT_WORDS,
  withMedia,
  type MediaSort,
} from "./media-library.ts";
import type { Model } from "./media-library-model.react.tsx";

const GROUP_WORDS = { flat: "None", folder: "Folder", month: "Month" } as const;
const KEYS: Array<[string | string[], string]> = [
  [["Mod+k", "/"], "Find a file"],
  [["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], "Move through the files"],
  [["Home", "End"], "First or last file"],
  ["Enter", "Open the file's details"],
  [["Space", "x"], "Select the file"],
  ["Escape", "Clear the selection, then close the details"],
];

// The tabs, the search, the tag and lens chips, and the bar with the count, the layout, the filters,
// the display and the toolbar's actions.
export function LibraryToolbar({ m }: { m: Model }) {
  const {
    Form,
    action,
    can,
    data,
    dir,
    display,
    filterWords,
    filters,
    href,
    labels,
    layout,
    lensHint,
    lenses,
    mounted,
    offers,
    path,
    picker,
    plural,
    query,
    remember,
    rows,
    setUploadOpen,
    shown,
    shrinkAll,
    sort,
    submit,
    tileSize,
    title,
    trash,
    uid,
    uploads,
  } = m;
  const chipLinks = <V extends string>(
    label: string,
    options: Array<[V, string]>,
    current: V,
    to: (v: V) => MediaQuery,
    onPick?: (v: V) => void,
  ) => (
    <nav className="cap-media-lib-layout" aria-label={label}>
      <span className="cap-media-lib-tool-label" aria-hidden="true">
        {label}
      </span>
      {options.map(([v, text]) => (
        <a
          key={v}
          className="cap-chip"
          href={href(to(v))}
          aria-current={current === v ? "true" : undefined}
          onClick={onPick ? () => onPick(v) : undefined}
        >
          {text}
        </a>
      ))}
    </nav>
  );
  return (
    <>
      {!picker && offers.trash ? (
        <TabsNav aria-label={`${title}: library or Trash`} className="cap-media-lib-tabs">
          <TabLink
            href={href(withMedia(query, { view: undefined }))}
            current={!trash}
            count={data.counts?.library}
          >
            Library
          </TabLink>
          <TabLink
            href={href(withMedia(query, { view: "trash" }))}
            current={trash}
            count={data.counts?.trash}
          >
            Trash
          </TabLink>
        </TabsNav>
      ) : null}

      <Form
        method="get"
        action={path}
        className="cap-field-row"
        role="search"
        aria-label={`Find ${plural}`}
      >
        {(
          [
            "view",
            "layout",
            "size",
            "tag",
            "kind",
            "orientation",
            "lens",
            "sort",
            "dir",
            "group",
          ] as const
        ).map((k) => (query[k] ? <input key={k} type="hidden" name={k} value={query[k]} /> : null))}
        <div className="cap-field cap-field-wide">
          <label className="cap-field-label" htmlFor={`${uid}-q`}>
            Search
          </label>
          <input
            className="cap-input"
            type="search"
            id={`${uid}-q`}
            name="q"
            defaultValue={query.q ?? ""}
          />
        </div>
        <button type="submit" className="cap-btn">
          Show
        </button>
      </Form>

      {data.tags.length || lenses.length ? (
        <nav className="cap-media-lib-chips" aria-label={`Narrow the ${plural}`}>
          {data.tags.length ? (
            <ul className="cap-chips" aria-label="Tags">
              <li>
                <a
                  className="cap-chip"
                  href={href(withMedia(query, { tag: undefined }))}
                  aria-current={!query.tag ? "true" : undefined}
                >
                  Any tag
                </a>
              </li>
              {data.tags.map((t) => (
                <li key={t.tag}>
                  <a
                    className="cap-chip"
                    href={href(withMedia(query, { tag: t.tag }))}
                    aria-current={query.tag === t.tag ? "true" : undefined}
                  >
                    {t.tag}
                    {t.count != null ? <span className="cap-chip-count">{t.count}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {lenses.length ? (
            <ul className="cap-chips" aria-label="Lenses">
              {lenses.map((l) => (
                <li key={l.id}>
                  <a
                    className="cap-chip"
                    href={href(withMedia(query, { lens: query.lens === l.id ? undefined : l.id }))}
                    aria-current={query.lens === l.id ? "true" : undefined}
                    title={l.hint}
                  >
                    {l.label}
                    {l.count != null ? <span className="cap-chip-count">{l.count}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {lensHint ? <p className="cap-media-lib-note">{lensHint}</p> : null}
        </nav>
      ) : null}

      <div className="cap-media-lib-bar">
        <p className="cap-media-lib-count">
          {shown.length === 0 ? "" : countLine({ ...data, rows: shown }, labels)}
        </p>
        <div className="cap-media-lib-tools">
          {!picker ? (
            <nav className="cap-media-lib-layout" aria-label="Show as">
              <a
                className="cap-chip"
                href={href(withMedia(query, { layout: undefined }))}
                aria-current={layout === "grid" ? "true" : undefined}
                onClick={() => remember({ layout: "grid" })}
              >
                Grid
              </a>
              <a
                className="cap-chip"
                href={href(withMedia(query, { layout: "list" }))}
                aria-current={layout === "list" ? "true" : undefined}
                onClick={() => remember({ layout: "list" })}
              >
                List
              </a>
            </nav>
          ) : null}
          {filters ? (
            <Disclosure summary={`Filter: ${filterWords}`}>
              <div className="cap-media-lib-display">
                {chipLinks<"any" | NonNullable<MediaQuery["kind"]>>(
                  "Type",
                  [
                    ["any", "Any"],
                    ...(Object.entries(KIND_WORDS) as Array<
                      [NonNullable<MediaQuery["kind"]>, string]
                    >),
                  ],
                  query.kind ?? "any",
                  (v) => withMedia(query, { kind: v === "any" ? undefined : v }),
                )}
                {chipLinks<"any" | NonNullable<MediaQuery["orientation"]>>(
                  "Orientation",
                  [
                    ["any", "Any"],
                    ...(Object.entries(ORIENTATION_WORDS) as Array<
                      [NonNullable<MediaQuery["orientation"]>, string]
                    >),
                  ],
                  query.orientation ?? "any",
                  (v) => withMedia(query, { orientation: v === "any" ? undefined : v }),
                )}
              </div>
            </Disclosure>
          ) : null}
          {!picker ? (
            <Disclosure summary={`Display: ${display}`}>
              <div className="cap-media-lib-display">
                {chipLinks<MediaSort>(
                  "Sort",
                  [
                    ["added", SORT_WORDS.added],
                    ["name", SORT_WORDS.name],
                    ["size", SORT_WORDS.size],
                    ...(offers.usage ? [["used", SORT_WORDS.used] as [MediaSort, string]] : []),
                  ],
                  sort,
                  (v) => withMedia(query, { sort: v }),
                )}
                {chipLinks<"asc" | "desc">(
                  "Direction",
                  [
                    ["desc", "Descending"],
                    ["asc", "Ascending"],
                  ],
                  dir,
                  (v) => withMedia(query, { sort, dir: v }),
                )}
                {chipLinks<"flat" | "folder" | "month">(
                  "Group by",
                  [
                    ["flat", GROUP_WORDS.flat],
                    ["folder", GROUP_WORDS.folder],
                    ["month", GROUP_WORDS.month],
                  ],
                  query.group ?? "flat",
                  (v) => withMedia(query, { group: v === "flat" ? undefined : v }),
                )}
                {layout === "grid"
                  ? chipLinks<"s" | "m" | "l">(
                      "Tile size",
                      [
                        ["s", "S"],
                        ["m", "M"],
                        ["l", "L"],
                      ],
                      tileSize,
                      (v) => withMedia(query, { size: v }),
                      (v) => remember({ size: v }),
                    )
                  : null}
              </div>
            </Disclosure>
          ) : null}
          {!picker && trash && can.deleteMedia && offers.trash && rows.length > 0 ? (
            // The kit lists every file in Trash and asks for the count before anything goes.
            <Form method="post" action={action} className="cap-media-lib-extra">
              <button
                type="submit"
                className="cap-btn"
                data-variant="danger"
                name="intent"
                value="empty-trash"
              >
                Empty Trash
              </button>
            </Form>
          ) : null}
          {shrinkAll.length > 0 ? (
            // The kit lists every picture and asks before any is stored again (site-api v0.13.0).
            <Form method="post" action={action} className="cap-media-lib-extra">
              <input type="hidden" name="intent" value="resize" />
              {shrinkAll.map((r) => (
                <span key={r.key} hidden>
                  <input type="hidden" name="ids" value={r.key} />
                  <input type="hidden" name="versions" value={r.version} />
                </span>
              ))}
              <button type="submit" className="cap-btn">
                Shrink{" "}
                {shrinkAll.length === 1 ? "this picture" : `all ${shrinkAll.length} on this page`}
              </button>
            </Form>
          ) : null}
          {!picker && data.extra?.toolbar?.length ? (
            <Form method="post" action={action} className="cap-media-lib-extra">
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
          {uploads ? (
            // A link, so with no script the server renders the dialog open (?upload=1); with
            // `submit` it opens the dialog in place.
            <a
              className="cap-btn cap-media-lib-upload-open"
              data-variant="primary"
              href={href(withMedia(query, { upload: true }))}
              aria-haspopup={mounted && submit ? "dialog" : undefined}
              onClick={(e) => {
                if (!submit) return;
                e.preventDefault();
                setUploadOpen(true);
              }}
            >
              Upload
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
}

// The notes under the toolbar: sorted on this page only, what was copied, what others changed, what
// the site withheld and why.
export function LibraryNotes({ m }: { m: Model }) {
  const {
    copied,
    href,
    inspected,
    inspectedMoved,
    live,
    page,
    picker,
    polling,
    query,
    stale,
    withheld,
  } = m;
  return (
    <>
      {page.sortedOnPage ? (
        <p className="cap-media-lib-note">
          Sorted on this page only: this site does not sort its whole library.
        </p>
      ) : null}
      {!picker ? (
        <p className="cap-media-lib-note" role="status">
          {copied}
        </p>
      ) : null}
      {polling ? (
        <p className="cap-media-lib-note" role="status" data-cap-part="live">
          {stale ? (
            <>
              The library changed more than this page can follow.{" "}
              <a href={href(query)}>Load it again</a>.
            </>
          ) : live.updated || live.elsewhere || inspectedMoved ? (
            <>
              {[
                live.updated
                  ? `${live.updated} ${live.updated === 1 ? "file was" : "files were"} changed elsewhere and ${live.updated === 1 ? "is" : "are"} shown as ${live.updated === 1 ? "it is" : "they are"} now.`
                  : null,
                live.elsewhere
                  ? `${live.elsewhere} more changed that this page does not show.`
                  : null,
                inspectedMoved ? `${inspected?.name} changed since you opened it.` : null,
              ]
                .filter(Boolean)
                .join(" ")}{" "}
              {live.elsewhere || inspectedMoved ? (
                <a href={href(query)}>Load the page again</a>
              ) : null}
            </>
          ) : null}
        </p>
      ) : null}

      {!picker && withheld.length ? (
        <ul className="cap-media-lib-withheld">
          {withheld.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

// The pager and the keyboard help.
export function LibraryFooter({ m }: { m: Model }) {
  const { href, page, picker, query, shortcuts, title } = m;
  return (
    <>
      {query.cursor || page.nextCursor ? (
        <nav className="cap-media-lib-pages" aria-label={`${title} pages`}>
          {query.cursor ? (
            <a className="cap-btn" href={href(withMedia(query, {}))}>
              First page
            </a>
          ) : null}
          {page.nextCursor ? (
            <a
              className="cap-btn"
              href={href({ ...withMedia(query, {}), cursor: page.nextCursor })}
            >
              Next page
            </a>
          ) : null}
        </nav>
      ) : null}

      {!picker && shortcuts ? (
        <Disclosure summary="Keyboard shortcuts">
          <dl className="cap-media-lib-keys">
            {KEYS.map(([spec, what]) => (
              <div key={what}>
                <dt>
                  <Keys spec={spec} />
                </dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>
      ) : null}
    </>
  );
}
