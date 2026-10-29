import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { CommandMenu, type Command } from "../command-menu/command-menu.react.tsx";
import type { ContentLabels, IntentResult, MediaData, MediaQuery, PickedMedia, SubmitIntent } from "../content/content.ts";
import { ContentBulkBar, PlainForm, useIntents, type FormComponent } from "../content/content.react.tsx";
import { Disclosure } from "../disclosure/disclosure.react.tsx";
import { DropZone } from "../drop-zone/drop-zone.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { MediaGrid, MediaInspector, useMediaMode, type MediaFields } from "../media/media.react.tsx";
import { bareType, byteSize, copyText, CROPPABLE, suggestedAlt, type MediaRecord } from "../media/media.ts";
import { acceptLabel, formatBytes } from "../drop-zone/drop-zone.ts";
import { readPref, writePref } from "../shell/shell.ts";
import { Keys, useShortcut } from "../shortcuts/shortcuts.react.tsx";
import { TabLink, TabsNav } from "../tabs/tabs.react.tsx";
import { countLine, dirOf, emptyWords, groupRows, inspectorOffers, lensChips, mediaActions, mediaHref, nounsOf, pickable, SORT_DIR, uploadRules, withMedia, type MediaSort } from "./media-library.ts";

// The viewer's last layout and tile size, remembered in this browser (shell.ts readPref).
const LAYOUT_PREF = "cap-media-layout";
const SIZE_PREF = "cap-media-size";

const SORT_WORDS: Record<MediaSort, string> = { added: "Newest", name: "A to Z", size: "Largest" };
const GROUP_WORDS = { flat: "None", folder: "Folder", month: "Month" } as const;
const KEYS: Array<[string | string[], string]> = [
  [["Mod+k", "/"], "Find a file"],
  [["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], "Move through the files"],
  [["Home", "End"], "First or last file"],
  ["Enter", "Open the file's details"],
  [["Space", "x"], "Select the file"],
  ["Escape", "Clear the selection, then close the details"],
];

export type { FormComponent, IntentResult, MediaData, PickedMedia, SubmitIntent };

export interface MediaLibraryProps {
  // The loader's view data: one page of one site's files.
  data: MediaData;
  // Where the forms post, and the library's own address: usually the route itself.
  action: string;
  Form?: FormComponent;
  // The script path: posts a form and resolves with the action's result. With it, outcomes, Undo,
  // the confirm dialog and the inspector's autosave happen in place.
  submit?: SubmitIntent;
  // The last result from the action, for the page that comes back after a post with no script.
  result?: IntentResult | null;
  labels?: ContentLabels;
  // "library" (the default) manages files; "picker" offers images to insert, with an alt step.
  mode?: "library" | "picker";
  // How the inspector saves: "form" (the default), one form per field with its own Save button,
  // which works with no script; or "autosave" (needs `submit`), saving by itself as you type.
  inspector?: "form" | "autosave";
  // Picker mode, with script: called with the file and the alt text written for this use, in
  // place of posting `intent=pick`.
  onPick?: (picked: PickedMedia) => void;
  // Quick search, with script: the files matching what was typed (the host asks the kit). With it,
  // Ctrl K, Cmd K or "/" opens the command menu over those files; without it, the keys put focus in
  // the search field.
  search?: (query: string, signal: AbortSignal) => Promise<MediaRecord[]>;
  // False leaves Ctrl K, Cmd K and "/" to the host (an app-wide command menu). True by default in
  // library mode; the picker never takes them.
  shortcuts?: boolean;
  // A file's own bytes on the page's own origin (the host serves them), for the crop editor, whose
  // canvas could not export a picture from another origin. Without it, or without `submit`, there
  // is no Crop.
  bytesHref?: (key: string) => string;
}

// One page of one site's files, the same component in Carrel and in every site admin: search, tag
// chips, the library and Trash, the grid or list of tiles, upload checked against the site's limits,
// the bulk bar with each file's outcome, the inspector (from ?inspect=) in form or autosave mode,
// Undo, and the confirmation for what cannot be undone. In picker mode, the same grid offers images
// and asks for the alt text this use needs. Every action is a form post, so it works with no
// script; `submit` adds the in-place path.
export function MediaLibrary({ data, action, Form = PlainForm, submit, result = null, labels, mode = "library", inspector = "form", onPick, search, shortcuts = true, bytesHref }: MediaLibraryProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const formId = `${uid}-bulk`;
  const { plural } = nounsOf(labels);
  const title = mode === "picker" ? "Choose an image" : plural.charAt(0).toUpperCase() + plural.slice(1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { rows, query, page, offers, can } = data;
  const path = action.split("?")[0] ?? action;
  const href = (q: MediaQuery) => mediaHref(path, q);
  const picker = mode === "picker";
  const trash = query.view === "trash";
  const { bulk, withheld } = mediaActions(data, labels);
  const selectable = !picker && bulk.length > 0;
  const shown = picker ? pickable(rows) : rows;
  const names = useMemo(() => new Map(rows.map((r) => [r.key, r.name])), [rows]);

  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => setSelected((s) => s.filter((k) => names.has(k))), [names]);
  const [active, setActive] = useState(query.inspect ?? query.pick ?? shown[0]?.key ?? "");
  const [chosen, setChosen] = useState<string | undefined>(query.pick);
  useEffect(() => setChosen(query.pick), [query.pick]);
  const intents = useIntents({ action, Form, submit, result, names, cancelHref: href(withMedia(query, {})), onDone: () => setSelected([]) });

  // Moving to another view of the library (open a file, close it) with script is a GET of the
  // library's own form, so the host's router (React Router's <Form>) makes it a navigation in the
  // app and the loader reads the file with where it is used.
  const goRef = useRef<HTMLDivElement>(null);
  const [goTo, setGoTo] = useState<MediaQuery | null>(null);
  useEffect(() => {
    if (!goTo) return;
    goRef.current?.querySelector("form")?.requestSubmit();
  }, [goTo]);
  const go = (q: MediaQuery) => setGoTo(q);

  const layoutRef = useRef<HTMLDivElement>(null);
  const inspectorMode = useMediaMode(layoutRef);
  const insRef = useRef<{ focus: () => void }>(null);
  const inspected = picker ? null : (data.inspected ?? null);
  // A file the person opened (Enter or a click) gets focus in its first field once it is here; one
  // that came with the page leaves focus where the page put it.
  const opening = useRef(false);
  useEffect(() => {
    if (!opening.current) return;
    opening.current = false;
    if (picker) document.getElementById(`${uid}-pick-alt`)?.focus();
    else insRef.current?.focus();
  }, [inspected?.key, chosen, picker, uid]);
  const iOffers = inspectorOffers(data);

  // Grid or list and the tile size: the address's when a link set them, else this viewer's last
  // choice (read after mount, so the server's HTML and the first paint agree).
  const [pref, setPref] = useState<Pick<MediaQuery, "layout" | "size">>({});
  useEffect(() => {
    const l = readPref(LAYOUT_PREF);
    const z = readPref(SIZE_PREF);
    setPref({ ...(l === "grid" || l === "list" ? { layout: l } : {}), ...(z === "s" || z === "m" || z === "l" ? { size: z } : {}) });
  }, []);
  const remember = (change: Pick<MediaQuery, "layout" | "size">) => {
    if (change.layout) writePref(LAYOUT_PREF, change.layout);
    if (change.size) writePref(SIZE_PREF, change.size);
    setPref((p) => ({ ...p, ...change }));
  };

  // Quick search: the command menu over the host's matches, or focus in the search field.
  const [finding, setFinding] = useState(false);
  useShortcut(
    ["Mod+k", "/"],
    () => {
      if (search) return setFinding(true);
      const field = document.getElementById(`${uid}-q`);
      if (field instanceof HTMLInputElement) {
        field.focus();
        field.select();
      }
    },
    { label: `Find a ${nounsOf(labels).noun}`, group: "Media", when: () => shortcuts && !picker },
  );
  // Copying an address says so, in words, where the person is looking.
  const [copied, setCopied] = useState("");
  const copyAddress = async (r: MediaRecord) => {
    const ok = await copyText(r.url);
    setCopied(ok ? `Copied the address of ${r.name}.` : `Could not copy. The address of ${r.name} is ${r.url}`);
  };
  const find = async (text: string, signal: AbortSignal): Promise<Command[]> => {
    const found = (search ? await search(text, signal) : []).slice(0, 8);
    return [
      ...found.map((r) => ({
        id: `file-${r.key}`,
        label: r.name,
        group: plural.charAt(0).toUpperCase() + plural.slice(1),
        keywords: [r.key],
        hint: [r.type.split("/").pop()?.toUpperCase(), byteSize(r.bytes)].filter(Boolean).join(" · "),
        run: () => {
          opening.current = true;
          go(withMedia(query, { inspect: r.key }));
        },
      })),
      ...found.map((r) => ({ id: `copy-${r.key}`, label: `Copy the address of ${r.name}`, group: "Copy the address", keywords: [r.key], run: () => void copyAddress(r) })),
      { id: "search-all", label: `Search for “${text}”`, group: "Search", run: () => go(withMedia(query, { q: text })) },
    ];
  };

  // Esc on a tile clears the selection first, then closes the file's details.
  const onGridKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Escape" || e.defaultPrevented || !(e.target as Element).closest(".cap-media-tile")) return;
    if (selected.length) {
      e.preventDefault();
      setSelected([]);
    } else if (inspected) {
      e.preventDefault();
      opening.current = false;
      go(withMedia(query, { inspect: undefined }));
    }
  };

  // The inspector's autosave posts one `save` with every field the site keeps.
  const save = async (key: string, fields: MediaFields) => {
    if (!submit) return;
    const form = new FormData();
    form.set("intent", "save");
    form.set("ids", key);
    const version = rows.find((r) => r.key === key)?.version ?? inspected?.version;
    if (version) form.set("versions", version);
    if (iOffers.alt) {
      form.set("alt", fields.alt);
      if (fields.decorative) form.set("decorative", "on");
    }
    if (iOffers.caption) form.set("caption", fields.caption);
    if (iOffers.tags) form.set("tags", fields.tags.join(", "));
    const r = await submit(form);
    if (!r.ok) throw new Error(r.message);
  };

  // Picker mode with `onPick`: the alt step hands the file to the host instead of posting.
  const onSubmit = (e: FormEvent<HTMLElement>) => {
    const form = e.target;
    if (onPick && form instanceof HTMLFormElement && form.dataset.capPart === "pick") {
      e.preventDefault();
      const fd = new FormData(form, (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null);
      const item = rows.find((r) => r.key === fd.get("ids"));
      if (item) onPick({ id: item.key, url: item.url, alt: fd.get("decorative") ? "" : String(fd.get("alt") ?? "").trim() });
      return;
    }
    intents.onSubmit(e);
  };

  if (intents.confirmPage) {
    return (
      <section className="cap-media-lib" data-cap="media-library" aria-label={title}>
        {intents.confirmPage}
      </section>
    );
  }

  const pick = picker && chosen ? rows.find((r) => r.key === chosen) : undefined;
  const words = emptyWords(query, labels);
  const rules = offers.upload ? uploadRules(offers.upload, picker) : null;
  const canUpload = !!rules && can.edit && !trash;
  // The picture tools for the open file: the focal point, replace (the file's own type, the site's
  // size limit) and crop (with script and the host's same-origin bytes).
  const tools = (item: MediaRecord) => {
    const type = bareType(item.type);
    const asNew = can.edit && !!offers.upload?.types.includes(type);
    const replace = iOffers.replace && !!item.version && offers.upload ? { accept: type, hint: `A new ${acceptLabel(type)} file, up to ${formatBytes(offers.upload.maxBytes)}.` } : null;
    const crop =
      bytesHref && submit && CROPPABLE.includes(type) && (asNew || replace)
        ? {
            src: bytesHref(item.key),
            asNew,
            inPlace: !!replace,
            onSave: async (file: File, how: "new" | "replace") => {
              const form = new FormData();
              form.set("intent", how === "new" ? "upload" : "replace");
              if (how === "replace") {
                form.set("ids", item.key);
                if (item.version) form.set("versions", item.version);
              }
              form.set("file", file);
              const r = await intents.run(form);
              if (!r?.ok) throw new Error(r?.message ?? "The crop was not saved.");
              const made = how === "new" ? r.outcomes?.find((o) => o.ok)?.id : undefined;
              if (made) go(withMedia(query, { inspect: made }));
            },
          }
        : null;
    return { focus: iOffers.focus && !!item.version, replace, crop, keepsSize: !!offers.replaceKeepsSize };
  };
  const layout = query.layout ?? pref.layout ?? "grid";
  const tileSize = query.size ?? pref.size ?? "m";
  const sort = query.sort ?? "added";
  const dir = dirOf(query);
  const lenses = picker || trash ? [] : lensChips(data);
  const lensHint = lenses.find((l) => l.id === query.lens)?.hint;
  const groups = groupRows(shown, query.group);
  const display = [`${SORT_WORDS[sort]}${dir === SORT_DIR[sort] ? "" : ", reversed"}`, query.group ? `by ${query.group}` : null, layout === "grid" ? `size ${tileSize.toUpperCase()}` : null].filter(Boolean).join(", ");
  const chipLinks = <V extends string>(label: string, options: Array<[V, string]>, current: V, to: (v: V) => MediaQuery, onPick?: (v: V) => void) => (
    <nav className="cap-media-lib-layout" aria-label={label}>
      <span className="cap-media-lib-tool-label" aria-hidden="true">
        {label}
      </span>
      {options.map(([v, text]) => (
        <a key={v} className="cap-chip" href={href(to(v))} aria-current={current === v ? "true" : undefined} onClick={onPick ? () => onPick(v) : undefined}>
          {text}
        </a>
      ))}
    </nav>
  );

  return (
    <section className="cap-media-lib" data-cap="media-library" data-mode={picker ? "picker" : undefined} aria-label={title} ref={(el) => void (intents.rootRef.current = el)} onSubmit={onSubmit}>
      <div ref={goRef} hidden>
        <Form method="get" action={path}>
          {Object.entries(goTo ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
        </Form>
      </div>

      {!picker && offers.trash ? (
        <TabsNav aria-label={`${title}: library or Trash`} className="cap-media-lib-tabs">
          <TabLink href={href(withMedia(query, { view: undefined }))} current={!trash} count={data.counts?.library}>
            Library
          </TabLink>
          <TabLink href={href(withMedia(query, { view: "trash" }))} current={trash} count={data.counts?.trash}>
            Trash
          </TabLink>
        </TabsNav>
      ) : null}

      <Form method="get" action={path} className="cap-media-lib-filters" role="search" aria-label={`Find ${plural}`}>
        {(["view", "layout", "size", "tag", "lens", "sort", "dir", "group"] as const).map((k) => (query[k] ? <input key={k} type="hidden" name={k} value={query[k]} /> : null))}
        <div className="cap-field cap-media-lib-search">
          <label className="cap-field-label" htmlFor={`${uid}-q`}>
            Search
          </label>
          <input className="cap-input" type="search" id={`${uid}-q`} name="q" defaultValue={query.q ?? ""} />
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
                <a className="cap-chip" href={href(withMedia(query, { tag: undefined }))} aria-current={!query.tag ? "true" : undefined}>
                  Any tag
                </a>
              </li>
              {data.tags.map((t) => (
                <li key={t.tag}>
                  <a className="cap-chip" href={href(withMedia(query, { tag: t.tag }))} aria-current={query.tag === t.tag ? "true" : undefined}>
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
                  <a className="cap-chip" href={href(withMedia(query, { lens: query.lens === l.id ? undefined : l.id }))} aria-current={query.lens === l.id ? "true" : undefined} title={l.hint}>
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
        <p className="cap-media-lib-count">{shown.length === 0 ? "" : countLine({ ...data, rows: shown }, labels)}</p>
        <div className="cap-media-lib-tools">
          {!picker ? (
            <nav className="cap-media-lib-layout" aria-label="Show as">
              <a className="cap-chip" href={href(withMedia(query, { layout: undefined }))} aria-current={layout === "grid" ? "true" : undefined} onClick={() => remember({ layout: "grid" })}>
                Grid
              </a>
              <a className="cap-chip" href={href(withMedia(query, { layout: "list" }))} aria-current={layout === "list" ? "true" : undefined} onClick={() => remember({ layout: "list" })}>
                List
              </a>
            </nav>
          ) : null}
          {!picker ? (
            <Disclosure summary={`Display: ${display}`}>
              <div className="cap-media-lib-display">
                {chipLinks<MediaSort>("Sort", [["added", SORT_WORDS.added], ["name", SORT_WORDS.name], ["size", SORT_WORDS.size]], sort, (v) => withMedia(query, { sort: v }))}
                {chipLinks<"asc" | "desc">("Direction", [["desc", "Descending"], ["asc", "Ascending"]], dir, (v) => withMedia(query, { sort, dir: v }))}
                {chipLinks<"flat" | "folder" | "month">("Group by", [["flat", GROUP_WORDS.flat], ["folder", GROUP_WORDS.folder], ["month", GROUP_WORDS.month]], query.group ?? "flat", (v) => withMedia(query, { group: v === "flat" ? undefined : v }))}
                {layout === "grid" ? chipLinks<"s" | "m" | "l">("Tile size", [["s", "S"], ["m", "M"], ["l", "L"]], tileSize, (v) => withMedia(query, { size: v }), (v) => remember({ size: v })) : null}
              </div>
            </Disclosure>
          ) : null}
          {!picker && data.extra?.toolbar?.length ? (
            <Form method="post" action={action} className="cap-media-lib-extra">
              {data.extra.toolbar.map((a) => (
                <button key={a.intent} type="submit" className="cap-btn" name="intent" value={a.intent}>
                  {a.label}
                </button>
              ))}
            </Form>
          ) : null}
        </div>
      </div>

      {page.sortedOnPage ? <p className="cap-media-lib-note">Sorted on this page only: this site does not sort its whole library.</p> : null}
      {!picker ? (
        <p className="cap-media-lib-note" role="status">
          {copied}
        </p>
      ) : null}

      {!picker && withheld.length ? (
        <ul className="cap-media-lib-withheld">
          {withheld.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {canUpload && rules ? (
        <Form method="post" action={action} encType="multipart/form-data" className="cap-media-lib-upload" aria-label={`Upload a ${nounsOf(labels).noun}`}>
          <input type="hidden" name="intent" value="upload" />
          <DropZone name="file" accept={rules.accept} maxBytes={offers.upload?.maxBytes} hint={rules.hint} />
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${uid}-upalt`}>
              Alt text
            </label>
            <input className="cap-input" id={`${uid}-upalt`} name="alt" type="text" autoComplete="off" aria-describedby={`${uid}-upalt-help`} />
            <p className="cap-field-help" id={`${uid}-upalt-help`}>
              What the picture shows, for a person who cannot see it. You can add it later.
            </p>
          </div>
          <button type="submit" className="cap-btn" data-variant="primary">
            Upload
          </button>
        </Form>
      ) : null}

      {intents.resultBox}

      {selectable ? (
        <ContentBulkBar
            formId={formId}
            action={action}
            Form={Form}
            formClass="cap-media-lib-bulk-form"
            items={rows.filter((r) => selected.includes(r.key)).map((r) => ({ id: r.key, label: r.name }))}
            total={shown.length}
            onSelectAll={mounted ? () => setSelected(shown.filter((r) => r.state === "ready" || r.state === "binned").map((r) => r.key)) : undefined}
            onClear={() => setSelected([])}
            plural={plural}
            actions={bulk}
            tag={bulk.some((a) => a.intent === "add-tags")}
            intents={intents}
          />
      ) : null}

      <div className="cap-media" data-size={tileSize} data-view={layout === "list" ? "list" : undefined}>
        <div className="cap-media-layout" ref={layoutRef}>
          <div className="cap-media-main" onKeyDown={onGridKey}>
            {shown.length === 0 ? (
              <Empty
                kind={words.kind}
                title={words.title}
                action={
                  words.kind === "no-match" ? (
                    <a className="cap-btn" href={href(withMedia(query, { q: undefined, tag: undefined, lens: undefined }))}>
                      Clear filters
                    </a>
                  ) : undefined
                }
              >
                {words.text}
              </Empty>
            ) : (
              <MediaGrid
                items={groups ? undefined : shown}
                groups={groups ?? undefined}
                activeKey={active}
                onActiveChange={setActive}
                selected={selected}
                onSelectedChange={setSelected}
                selectable={selectable}
                selectForm={selectable ? formId : undefined}
                hrefFor={(key) => href(withMedia(query, picker ? { pick: key } : { inspect: key }))}
                onOpen={(key) => {
                  if (key === (picker ? chosen : inspected?.key)) {
                    if (picker) document.getElementById(`${uid}-pick-alt`)?.focus();
                    else insRef.current?.focus();
                    return;
                  }
                  opening.current = true;
                  if (picker) return setChosen(key);
                  go(withMedia(query, { inspect: key }));
                }}
                inspecting={!!inspected}
                label={picker ? "Images" : trash ? "Files in Trash" : "Files"}
              />
            )}
          </div>
          {inspected ? (
            <MediaInspector
              ref={insRef}
              id={`${uid}-ins`}
              item={inspected}
              open
              mode={inspectorMode}
              onSave={save}
              onClose={() => go(withMedia(query, { inspect: undefined }))}
              onStep={(dir) => {
                const keys = shown.filter((r) => r.state === "ready" || r.state === "binned").map((r) => r.key);
                const next = keys[keys.indexOf(inspected.key) + (dir === "next" ? 1 : -1)];
                if (next) go(withMedia(query, { inspect: next }));
              }}
              show={{ alt: iOffers.alt, title: false, caption: iOffers.caption, tags: iOffers.tags }}
              tools={tools(inspected)}
              onTool={(form) => void intents.run(form)}
              saving={inspector === "autosave" && submit ? "auto" : "form"}
              action={action}
              Form={Form}
              closeHref={href(withMedia(query, { inspect: undefined }))}
              can={{ trash: iOffers.trash, delete: iOffers.delete && (trash || !offers.trash) }}
            />
          ) : null}
        </div>
      </div>

      {pick ? (
        <Form method="post" action={action} className="cap-media-pick" data-cap-part="pick" aria-labelledby={`${uid}-pick-h`}>
          <input type="hidden" name="intent" value="pick" />
          <input type="hidden" name="ids" value={pick.key} />
          <h3 className="cap-media-pick-title" id={`${uid}-pick-h`}>
            Alt text for {pick.name}
          </h3>
          {pick.thumb ? <img className="cap-media-pick-preview" src={pick.thumb} alt="" width={160} height={160} /> : null}
          <div className="cap-field">
            <label className="cap-field-label" htmlFor={`${uid}-pick-alt`}>
              Alt text (required)
            </label>
            <textarea className="cap-input" id={`${uid}-pick-alt`} name="alt" rows={2} required defaultValue={pick.alt} aria-describedby={`${uid}-pick-help`} />
            <p className="cap-field-help" id={`${uid}-pick-help`}>
              What a person who cannot see the picture needs to know here. {pick.alt ? "It starts with the file's own alt text." : `Suggested: ${suggestedAlt(pick.name)}.`}
            </p>
          </div>
          <div className="cap-media-pick-actions">
            <button type="submit" className="cap-btn" data-variant="primary">
              Insert
            </button>
            <button type="submit" className="cap-btn" name="decorative" value="on" formNoValidate>
              Insert as decorative
            </button>
            <a className="cap-btn" data-variant="quiet" href={href(withMedia(query, { pick: undefined }))} onClick={(e) => {
                if (!mounted) return;
                e.preventDefault();
                setChosen(undefined);
              }}>
              Choose another
            </a>
          </div>
        </Form>
      ) : null}

      {query.cursor || page.nextCursor ? (
        <nav className="cap-media-lib-pages" aria-label={`${title} pages`}>
          {query.cursor ? (
            <a className="cap-btn" href={href(withMedia(query, {}))}>
              First page
            </a>
          ) : null}
          {page.nextCursor ? (
            <a className="cap-btn" href={href({ ...withMedia(query, {}), cursor: page.nextCursor })}>
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

      {search && !picker ? <CommandMenu open={finding} onOpenChange={setFinding} commands={[]} search={find} bindKeys={false} label={`Find a ${nounsOf(labels).noun}`} placeholder="Name, address or alt text" /> : null}

      {intents.confirmDialog}
    </section>
  );
}
