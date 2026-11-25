import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { type Command } from "../command-menu/command-menu.react.tsx";
import {
  nounsOf,
  type ContentLabels,
  type IntentResult,
  type MediaData,
  type MediaQuery,
  type PickedMedia,
  type SubmitIntent,
} from "../content/content.ts";
import { useIntents } from "../content/content.react.tsx";
import { PlainForm, type FormComponent } from "../plain-form/plain-form.react.tsx";
import { useMediaMode } from "../media/media.react.tsx";
import { type MediaRecord } from "../media/media.ts";
import { copyText } from "../copy/copy.ts";
import { formatBytes } from "../format/format.ts";
import { readStored, writeStored } from "../hooks/hooks.ts";
import { useShortcut } from "../shortcuts/shortcuts.react.tsx";
import {
  dirOf,
  emptyWords,
  filesToOpen,
  groupRows,
  inspectorOffers,
  KIND_WORDS,
  lensChips,
  mediaActions,
  mediaHref,
  ORIENTATION_WORDS,
  oversized,
  pickable,
  SORT_DIR,
  SORT_WORDS,
  uploadRules,
  withMedia,
  type KitMediaChanges,
} from "./media-library.ts";
import { useCleanId, useHydrated } from "../hooks/hooks.react.tsx";
import { useLiveRows } from "./media-library-live.react.tsx";
import { useInspectorSave } from "./media-library-save.react.tsx";
import { pictureTools } from "./media-library-tools.ts";

// The viewer's last layout and tile size, remembered in this browser (hooks' readStored).
const LAYOUT_PREF = "cap-media-layout";
const SIZE_PREF = "cap-media-size";

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
  // Live updates, with script, where the kit offers them (`offers.live` and `page.changeCursor`,
  // site-api v0.13.0): what others changed since a cursor, as the kit's `loadMediaChanges(source,
  // cursor)` answers it (the host serves it, say as a JSON route). The library asks every 15 seconds
  // while the page is visible, at once again when more wait, puts changed files in place and takes
  // deleted ones out; `{ reload: true }` asks the person to load the page again. Without script, or
  // without it, the page is as the server sent it.
  changes?: (cursor: string, signal: AbortSignal) => Promise<KitMediaChanges | { reload: true }>;
}

// Everything the library page decides before it draws: the live rows, the selection, the open file,
// the saves, the picture tools, the intents and the view the address asks for. The components in
// media-library.react.tsx and its siblings only draw what this returns.
export function useMediaLibrary({
  data,
  action,
  Form = PlainForm,
  submit,
  result = null,
  labels,
  mode = "library",
  inspector = "form",
  onPick,
  search,
  shortcuts = true,
  bytesHref,
  changes,
}: MediaLibraryProps) {
  const uid = useCleanId();
  const formId = `${uid}-bulk`;
  const { plural } = nounsOf(labels, "file");
  const title =
    mode === "picker" ? "Choose an image" : plural.charAt(0).toUpperCase() + plural.slice(1);
  // False on the server and while hydrating, true once hydrated.
  const mounted = useHydrated();
  const { query, page, offers, can } = data;
  const path = action.split("?")[0] ?? action;
  const href = (q: MediaQuery) => mediaHref(path, q);
  const picker = mode === "picker";

  const { changed, polling, stale, live } = useLiveRows(data, changes, picker);
  const rows = live.rows;
  const trash = query.view === "trash";
  const { bulk, withheld } = mediaActions(data, labels);
  const selectable = !picker && bulk.length > 0;
  const shown = picker ? pickable(rows) : rows;
  const names = useMemo(() => new Map(rows.map((r) => [r.key, r.name])), [rows]);

  const [selected, setSelected] = useState<string[]>([]);
  // New rows keep only the picks still in them, in the same render.
  const [pickedFrom, setPickedFrom] = useState(names);
  if (names !== pickedFrom) {
    setPickedFrom(names);
    setSelected((s) => s.filter((k) => names.has(k)));
  }
  const [active, setActive] = useState(query.inspect ?? query.pick ?? shown[0]?.key ?? "");
  const [chosen, setChosen] = useState<string | undefined>(query.pick);
  const [askedPick, setAskedPick] = useState(query.pick);
  if (query.pick !== askedPick) {
    setAskedPick(query.pick);
    setChosen(query.pick);
  }
  // The last result the script path got, for the links to what an upload, an import or a turn left
  // to open; the page's own result otherwise.
  const [last, setLast] = useState<IntentResult | null>(null);
  // The upload dialog, with script; the address opens it too (`upload=1`, the toolbar's link with
  // no script).
  const [uploadOpen, setUploadOpen] = useState(!!query.upload);
  const [pageResult, setPageResult] = useState(result);
  if (result !== pageResult) {
    setPageResult(result);
    setLast(null);
  }
  const tracked: SubmitIntent | undefined = submit
    ? async (form) => {
        const r = await submit(form);
        setLast(r);
        return r;
      }
    : undefined;
  const intents = useIntents({
    action,
    Form,
    submit: tracked,
    result,
    names,
    cancelHref: href(withMedia(query, {})),
    onDone: () => setSelected([]),
  });

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
  const pickAlt = useRef<HTMLTextAreaElement>(null);
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
  const inspectedMoved =
    !!inspected &&
    changed.has(inspected.key) &&
    changed.get(inspected.key)?.version !== inspected.version;

  // Grid or list and the tile size: the address's when a link set them, else this viewer's last
  // choice (read after mount, so the server's HTML and the first paint agree).
  const [pref, setPref] = useState<Pick<MediaQuery, "layout" | "size">>({});
  useEffect(() => {
    const l = readStored(LAYOUT_PREF);
    const z = readStored(SIZE_PREF);
    // oxlint-disable-next-line react/set-state-in-effect -- the stored choice is read after mount, so the server's HTML and the first paint agree
    setPref({
      ...(l === "grid" || l === "list" ? { layout: l } : {}),
      ...(z === "s" || z === "m" || z === "l" ? { size: z } : {}),
    });
  }, []);
  const remember = (change: Pick<MediaQuery, "layout" | "size">) => {
    if (change.layout) writeStored(LAYOUT_PREF, change.layout);
    if (change.size) writeStored(SIZE_PREF, change.size);
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
    {
      label: `Find a ${nounsOf(labels, "file").noun}`,
      group: "Media",
      when: () => shortcuts && !picker,
    },
  );
  // Copying an address says so, in words, where the person is looking.
  const [copied, setCopied] = useState("");
  const copyAddress = async (r: MediaRecord) => {
    const ok = await copyText(r.url);
    setCopied(
      ok
        ? `Copied the address of ${r.name}.`
        : `Could not copy. The address of ${r.name} is ${r.url}`,
    );
  };
  const find = async (text: string, signal: AbortSignal): Promise<Command[]> => {
    const found = (search ? await search(text, signal) : []).slice(0, 8);
    return [
      ...found.map((r) => ({
        id: `file-${r.key}`,
        label: r.name,
        group: plural.charAt(0).toUpperCase() + plural.slice(1),
        keywords: [r.key],
        hint: [r.type.split("/").pop()?.toUpperCase(), formatBytes(r.bytes)]
          .filter(Boolean)
          .join(" · "),
        run: () => {
          opening.current = true;
          go(withMedia(query, { inspect: r.key }));
        },
      })),
      ...found.map((r) => ({
        id: `copy-${r.key}`,
        label: `Copy the address of ${r.name}`,
        group: "Copy the address",
        keywords: [r.key],
        run: () => void copyAddress(r),
      })),
      {
        id: "search-all",
        label: `Search for “${text}”`,
        group: "Search",
        run: () => go(withMedia(query, { q: text })),
      },
    ];
  };

  // A tile opened (Enter or a click): the file's details, or in the picker its alt step. Opening the
  // file that is already open puts focus in its first field.
  const openFile = (key: string) => {
    if (key === (picker ? chosen : inspected?.key)) {
      if (picker) document.getElementById(`${uid}-pick-alt`)?.focus();
      else insRef.current?.focus();
      return;
    }
    opening.current = true;
    if (picker) return setChosen(key);
    go(withMedia(query, { inspect: key }));
  };

  // Esc on a tile clears the selection first, then closes the file's details.
  const onGridKey = (e: KeyboardEvent<HTMLElement>) => {
    if (
      e.key !== "Escape" ||
      e.defaultPrevented ||
      !(e.target as Element).closest(".cap-media-tile")
    )
      return;
    if (selected.length) {
      e.preventDefault();
      setSelected([]);
    } else if (inspected) {
      e.preventDefault();
      opening.current = false;
      go(withMedia(query, { inspect: undefined }));
    }
  };

  const save = useInspectorSave(submit, rows, inspected, iOffers);

  // Picker mode with `onPick`: the alt step hands the file to the host instead of posting.
  const onSubmit = (e: FormEvent<HTMLElement>) => {
    const form = e.target;
    if (onPick && form instanceof HTMLFormElement && form.dataset.capPart === "pick") {
      e.preventDefault();
      const fd = new FormData(
        form,
        (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null,
      );
      const item = rows.find((r) => r.key === fd.get("ids"));
      if (item)
        onPick({
          id: item.key,
          url: item.url,
          alt: fd.get("decorative") ? "" : String(fd.get("alt") ?? "").trim(),
        });
      return;
    }
    intents.onSubmit(e);
  };

  const pick = picker && chosen ? rows.find((r) => r.key === chosen) : undefined;
  // The model's alt text for the picked file, where the host read it (the kit's detail for `pick`
  // with `suggest`). Shown and offered; never put in the field unless the person chooses it.
  const suggestions = pick && data.inspected?.key === pick.key ? data.suggestions : undefined;
  const pickSuggestion = suggestions?.alt ?? "";
  const words = emptyWords(query, labels);
  const rules = offers.upload ? uploadRules(offers.upload, picker) : null;
  const canUpload = !!rules && can.edit && !trash;
  const canImport = !picker && can.edit && !trash && !!offers.import && !!offers.upload;
  const uploads = !picker && ((canUpload && !!rules) || canImport);

  const filters = !picker && !trash && !!offers.filters;
  const filterWords =
    [
      query.kind ? KIND_WORDS[query.kind] : null,
      query.orientation ? ORIENTATION_WORDS[query.orientation] : null,
    ]
      .filter(Boolean)
      .join(", ") || "everything";
  const toOpen = picker ? [] : filesToOpen(last ?? result);
  const nameOf = (id: string) => names.get(id) ?? id.split("/").pop() ?? id;
  // The resize pass: every oversized picture on this page, from the oversized lens.
  const shrinkAll =
    !picker && query.lens === "oversized" && iOffers.resize != null
      ? rows.filter(
          (r): r is MediaRecord & { version: string } =>
            r.state === "ready" && !!r.version && oversized(r, iOffers.resize),
        )
      : [];
  const tools = (item: MediaRecord) =>
    pictureTools(item, {
      offers,
      can,
      iOffers,
      bytesHref,
      submit,
      run: intents.run,
      open: (key) => go(withMedia(query, { inspect: key })),
    });
  const layout = query.layout ?? pref.layout ?? "grid";
  const tileSize = query.size ?? pref.size ?? "m";
  const sort = query.sort ?? "added";
  const dir = dirOf(query);
  const lenses = picker || trash ? [] : lensChips(data);
  const lensHint = lenses.find((l) => l.id === query.lens)?.hint;
  const groups = groupRows(shown, query.group);
  const display = [
    `${SORT_WORDS[sort]}${dir === SORT_DIR[sort] ? "" : ", reversed"}`,
    query.group ? `by ${query.group}` : null,
    layout === "grid" ? `size ${tileSize.toUpperCase()}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    Form,
    action,
    active,
    bulk,
    can,
    canImport,
    canUpload,
    copied,
    data,
    dir,
    display,
    filterWords,
    filters,
    find,
    finding,
    formId,
    go,
    goRef,
    goTo,
    groups,
    href,
    iOffers,
    insRef,
    inspected,
    inspectedMoved,
    inspector,
    inspectorMode,
    intents,
    labels,
    layout,
    layoutRef,
    lensHint,
    lenses,
    live,
    mounted,
    nameOf,
    offers,
    onGridKey,
    onSubmit,
    openFile,
    page,
    path,
    pick,
    pickAlt,
    pickSuggestion,
    picker,
    plural,
    polling,
    query,
    remember,
    rows,
    rules,
    save,
    search,
    selectable,
    selected,
    setActive,
    setChosen,
    setFinding,
    setLast,
    setSelected,
    setUploadOpen,
    shortcuts,
    shown,
    shrinkAll,
    sort,
    stale,
    submit,
    suggestions,
    tileSize,
    title,
    toOpen,
    uploads,
    tools,
    trash,
    uid,
    uploadOpen,
    withheld,
    words,
  };
}

export type Model = ReturnType<typeof useMediaLibrary>;
