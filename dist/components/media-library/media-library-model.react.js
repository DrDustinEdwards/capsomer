import { useEffect, useMemo, useRef, useState } from "react";
import {} from "../command-menu/command-menu.react.js";
import { nounsOf, } from "../content/content.js";
import { useIntents } from "../content/content.react.js";
import { PlainForm } from "../plain-form/plain-form.react.js";
import { useMediaMode } from "../media/media.react.js";
import {} from "../media/media.js";
import { copyText } from "../copy/copy.js";
import { formatBytes } from "../format/format.js";
import { readStored, writeStored } from "../hooks/hooks.js";
import { useShortcut } from "../shortcuts/shortcuts.react.js";
import { dirOf, emptyWords, filesToOpen, groupRows, inspectorOffers, KIND_WORDS, lensChips, mediaActions, mediaHref, ORIENTATION_WORDS, oversized, pickable, SORT_DIR, SORT_WORDS, uploadRules, withMedia, } from "./media-library.js";
import { useCleanId, useHydrated } from "../hooks/hooks.react.js";
import { useLiveRows } from "./media-library-live.react.js";
import { useInspectorSave } from "./media-library-save.react.js";
import { pictureTools } from "./media-library-tools.js";
// The viewer's last layout and tile size, remembered in this browser (hooks' readStored).
const LAYOUT_PREF = "cap-media-layout";
const SIZE_PREF = "cap-media-size";
// Everything the library page decides before it draws: the live rows, the selection, the open file,
// the saves, the picture tools, the intents and the view the address asks for. The components in
// media-library.react.tsx and its siblings only draw what this returns.
export function useMediaLibrary({ data, action, Form = PlainForm, submit, result = null, labels, mode = "library", inspector = "form", onPick, search, shortcuts = true, bytesHref, changes, }) {
    const uid = useCleanId();
    const formId = `${uid}-bulk`;
    const { plural } = nounsOf(labels, "file");
    const title = mode === "picker" ? "Choose an image" : plural.charAt(0).toUpperCase() + plural.slice(1);
    // False on the server and while hydrating, true once hydrated.
    const mounted = useHydrated();
    const { query, page, offers, can } = data;
    const path = action.split("?")[0] ?? action;
    const href = (q) => mediaHref(path, q);
    const picker = mode === "picker";
    const { changed, polling, stale, live } = useLiveRows(data, changes, picker);
    const rows = live.rows;
    const trash = query.view === "trash";
    const { bulk, withheld } = mediaActions(data, labels);
    const selectable = !picker && bulk.length > 0;
    const shown = picker ? pickable(rows) : rows;
    const names = useMemo(() => new Map(rows.map((r) => [r.key, r.name])), [rows]);
    const [selected, setSelected] = useState([]);
    // New rows keep only the picks still in them, in the same render.
    const [pickedFrom, setPickedFrom] = useState(names);
    if (names !== pickedFrom) {
        setPickedFrom(names);
        setSelected((s) => s.filter((k) => names.has(k)));
    }
    const [active, setActive] = useState(query.inspect ?? query.pick ?? shown[0]?.key ?? "");
    const [chosen, setChosen] = useState(query.pick);
    const [askedPick, setAskedPick] = useState(query.pick);
    if (query.pick !== askedPick) {
        setAskedPick(query.pick);
        setChosen(query.pick);
    }
    // The last result the script path got, for the links to what an upload, an import or a turn left
    // to open; the page's own result otherwise.
    const [last, setLast] = useState(null);
    // The upload dialog, with script; the address opens it too (`upload=1`, the toolbar's link with
    // no script).
    const [uploadOpen, setUploadOpen] = useState(!!query.upload);
    const [pageResult, setPageResult] = useState(result);
    if (result !== pageResult) {
        setPageResult(result);
        setLast(null);
    }
    const tracked = submit
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
    const goRef = useRef(null);
    const [goTo, setGoTo] = useState(null);
    useEffect(() => {
        if (!goTo)
            return;
        goRef.current?.querySelector("form")?.requestSubmit();
    }, [goTo]);
    const go = (q) => setGoTo(q);
    const layoutRef = useRef(null);
    const inspectorMode = useMediaMode(layoutRef);
    const insRef = useRef(null);
    const pickAlt = useRef(null);
    const inspected = picker ? null : (data.inspected ?? null);
    // A file the person opened (Enter or a click) gets focus in its first field once it is here; one
    // that came with the page leaves focus where the page put it.
    const opening = useRef(false);
    useEffect(() => {
        if (!opening.current)
            return;
        opening.current = false;
        if (picker)
            document.getElementById(`${uid}-pick-alt`)?.focus();
        else
            insRef.current?.focus();
    }, [inspected?.key, chosen, picker, uid]);
    const iOffers = inspectorOffers(data);
    const inspectedMoved = !!inspected &&
        changed.has(inspected.key) &&
        changed.get(inspected.key)?.version !== inspected.version;
    // Grid or list and the tile size: the address's when a link set them, else this viewer's last
    // choice (read after mount, so the server's HTML and the first paint agree).
    const [pref, setPref] = useState({});
    useEffect(() => {
        const l = readStored(LAYOUT_PREF);
        const z = readStored(SIZE_PREF);
        // oxlint-disable-next-line react/set-state-in-effect -- the stored choice is read after mount, so the server's HTML and the first paint agree
        setPref({
            ...(l === "grid" || l === "list" ? { layout: l } : {}),
            ...(z === "s" || z === "m" || z === "l" ? { size: z } : {}),
        });
    }, []);
    const remember = (change) => {
        if (change.layout)
            writeStored(LAYOUT_PREF, change.layout);
        if (change.size)
            writeStored(SIZE_PREF, change.size);
        setPref((p) => ({ ...p, ...change }));
    };
    // Quick search: the command menu over the host's matches, or focus in the search field.
    const [finding, setFinding] = useState(false);
    useShortcut(["Mod+k", "/"], () => {
        if (search)
            return setFinding(true);
        const field = document.getElementById(`${uid}-q`);
        if (field instanceof HTMLInputElement) {
            field.focus();
            field.select();
        }
    }, {
        label: `Find a ${nounsOf(labels, "file").noun}`,
        group: "Media",
        when: () => shortcuts && !picker,
    });
    // Copying an address says so, in words, where the person is looking.
    const [copied, setCopied] = useState("");
    const copyAddress = async (r) => {
        const ok = await copyText(r.url);
        setCopied(ok
            ? `Copied the address of ${r.name}.`
            : `Could not copy. The address of ${r.name} is ${r.url}`);
    };
    const find = async (text, signal) => {
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
    const openFile = (key) => {
        if (key === (picker ? chosen : inspected?.key)) {
            if (picker)
                document.getElementById(`${uid}-pick-alt`)?.focus();
            else
                insRef.current?.focus();
            return;
        }
        opening.current = true;
        if (picker)
            return setChosen(key);
        go(withMedia(query, { inspect: key }));
    };
    // Esc on a tile clears the selection first, then closes the file's details.
    const onGridKey = (e) => {
        if (e.key !== "Escape" ||
            e.defaultPrevented ||
            !e.target.closest(".cap-media-tile"))
            return;
        if (selected.length) {
            e.preventDefault();
            setSelected([]);
        }
        else if (inspected) {
            e.preventDefault();
            opening.current = false;
            go(withMedia(query, { inspect: undefined }));
        }
    };
    const save = useInspectorSave(submit, rows, inspected, iOffers);
    // Picker mode with `onPick`: the alt step hands the file to the host instead of posting.
    const onSubmit = (e) => {
        const form = e.target;
        if (onPick && form instanceof HTMLFormElement && form.dataset.capPart === "pick") {
            e.preventDefault();
            const fd = new FormData(form, e.nativeEvent.submitter);
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
    const filterWords = [
        query.kind ? KIND_WORDS[query.kind] : null,
        query.orientation ? ORIENTATION_WORDS[query.orientation] : null,
    ]
        .filter(Boolean)
        .join(", ") || "everything";
    const toOpen = picker ? [] : filesToOpen(last ?? result);
    const nameOf = (id) => names.get(id) ?? id.split("/").pop() ?? id;
    // The resize pass: every oversized picture on this page, from the oversized lens.
    const shrinkAll = !picker && query.lens === "oversized" && iOffers.resize != null
        ? rows.filter((r) => r.state === "ready" && !!r.version && oversized(r, iOffers.resize))
        : [];
    const tools = (item) => pictureTools(item, {
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
