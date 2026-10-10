// Mounts the specimens: PostsList as a host would hold it, with a small in-memory site standing in
// for the content kit, so every action can be tried. The kit's intents and words here are a
// specimen's, not a contract; the real ones live with the kit.
import { StrictMode, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContentCan, IntentResult, PostRow, PostsData } from "../content/content.ts";
import { MessageProvider } from "../message/message.react.tsx";
import { PostsList } from "./posts-list.react.tsx";

const NOW = Date.parse("2026-10-10T12:00:00Z");
const ALL: ContentCan = { edit: true, publish: true, deleteContent: true, deleteMedia: true, decideMentions: true };

const ROWS: PostRow[] = [
  { id: "foxhound-release", title: "Notes on the Foxhound release", kind: "post", status: "published", path: "/blog/foxhound-release", href: "/editor/foxhound-release", liveHref: "https://dustinedwards.info/blog/foxhound-release", publishAt: null, publishedAt: "2026-10-02T09:00:00Z", updatedAt: "2026-10-09T16:20:00Z", tags: ["release"] },
  { id: "uptime-strip", title: "Why the uptime strip counts gaps", kind: "post", status: "scheduled", path: null, href: "/editor/uptime-strip", liveHref: null, publishAt: "2026-10-13T08:00:00Z", publishedAt: null, updatedAt: "2026-10-10T08:05:00Z", tags: ["capsid"] },
  { id: "mention-queue", title: "What a mention queue is for", kind: "post", status: "draft", path: null, href: "/editor/mention-queue", liveHref: null, publishAt: null, publishedAt: null, updatedAt: "2026-10-08T21:40:00Z", notes: [{ text: "2 AI drafts waiting", tone: "info" }], tags: [] },
  { id: "read-only-agent", title: "Notes on a read-only agent", kind: "post", status: "published", path: "/blog/read-only-agent", href: "/editor/read-only-agent", liveHref: "https://dustinedwards.info/blog/read-only-agent", publishAt: null, publishedAt: "2026-09-21T10:00:00Z", updatedAt: "2026-09-22T08:00:00Z", tags: ["agents", "capsid"] },
  { id: "phage-lambda", title: "Phage lambda: lysis or lysogeny", kind: "post", status: "draft", path: null, href: "/editor/phage-lambda", liveHref: null, publishAt: null, publishedAt: null, updatedAt: "2026-10-01T12:00:00Z", notes: [{ text: "New draft" }, { text: "Held by a flag", tone: "warn" }] },
  { id: "about", title: "About", kind: "page", status: "published", path: "/about", href: "/editor/about", liveHref: "https://dustinedwards.info/about", publishAt: null, publishedAt: "2026-06-01T09:00:00Z", updatedAt: "2026-09-02T11:00:00Z", tags: [] },
];

const WORDS: Record<string, string> = { "foxhound-release": "1,240", "uptime-strip": "860", "mention-queue": "1,530", "read-only-agent": "2,110", "phage-lambda": "3,020", about: "410" };

function dataOf(rows: PostRow[], over: Partial<PostsData> = {}): PostsData {
  const count = (s: PostRow["status"]) => rows.filter((r) => r.status === s).length;
  return {
    site: { name: "dustinedwards.info" },
    query: {},
    rows,
    page: { nextCursor: null },
    counts: { all: rows.length, draft: count("draft"), scheduled: count("scheduled"), published: count("published") },
    kinds: ["post", "page"],
    offers: { delete: true, schedule: true, tags: true, duplicate: true },
    can: ALL,
    newHref: "/editor/new",
    extra: { columns: [{ id: "words", label: "Words", cells: WORDS }], toolbar: [{ intent: "ask-reindex", label: "Rebuild the Ask index" }] },
    ...over,
  };
}

const posts = (n: number) => (n === 1 ? "post" : "posts");

interface Win {
  postsLog: Array<Record<string, string | string[]>>;
}
const win = window as unknown as Win;
win.postsLog = [];

let copies = 0;

// The in-memory site: what the content kit would do through site-api, enough to try each action.
function useSite() {
  const [rows, setRowsState] = useState(ROWS);
  // The site's truth between renders: an Undo posted later reads the rows as they are then.
  const live = useRef(ROWS);
  const setRows = (f: (rs: PostRow[]) => PostRow[]) => {
    live.current = f(live.current);
    setRowsState(live.current);
  };
  const submit = async (form: FormData): Promise<IntentResult> => {
    const entry: Record<string, string | string[]> = {};
    for (const k of new Set(form.keys())) entry[k] = form.getAll(k).length > 1 ? form.getAll(k).map(String) : String(form.get(k));
    win.postsLog.push(entry);
    await new Promise((r) => setTimeout(r, 40));
    const intent = String(form.get("intent"));
    const ids = form.getAll("ids").map(String);
    const tag = String(form.get("tag") ?? "").trim();
    const rows = live.current;
    const title = (id: string) => rows.find((r) => r.id === id)?.title ?? id;
    switch (intent) {
      case "unpublish":
      case "republish": {
        const to = intent === "unpublish" ? "draft" : "published";
        setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status: to, publishAt: null, path: to === "draft" ? null : `/blog/${r.id}`, liveHref: to === "draft" ? null : `https://dustinedwards.info/blog/${r.id}` } : r)));
        return intent === "unpublish"
          ? { ok: true, message: `Unpublished ${ids.length === 1 ? `“${title(ids[0] ?? "")}”` : `${ids.length} posts`}.`, undo: { intent: "republish", fields: { ids } } }
          : { ok: true, message: `Published ${ids.length === 1 ? `“${title(ids[0] ?? "")}”` : `${ids.length} posts`} again.` };
      }
      case "duplicate": {
        const made = ids.map((id) => `${id}-copy-${++copies}`);
        setRows((rs) => [...ids.map((id, i) => ({ ...(rs.find((r) => r.id === id) as PostRow), id: made[i] ?? id, title: `Copy of ${title(id)}`, status: "draft" as const, path: null, liveHref: null, notes: [] })), ...rs]);
        return { ok: true, message: `Duplicated ${ids.length} ${posts(ids.length)} as drafts.`, undo: { intent: "remove-copies", fields: { ids: made } } };
      }
      case "remove-copies":
        setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
        return { ok: true, message: `Removed the ${ids.length === 1 ? "copy" : `${ids.length} copies`}.` };
      case "add-tag":
      case "remove-tag": {
        if (!tag) return { ok: false, message: "Type a tag first. Nothing was changed." };
        const adding = intent === "add-tag";
        // The site refuses a post with no front matter (Carrel's bulk.server.ts does).
        const refused: string[] = ids.filter((id) => id === "phage-lambda");
        const changed = ids.filter((id) => !refused.includes(id) && (rows.find((r) => r.id === id)?.tags ?? []).includes(tag) !== adding);
        setRows((rs) => rs.map((r) => (changed.includes(r.id) ? { ...r, tags: adding ? [...(r.tags ?? []), tag] : (r.tags ?? []).filter((t) => t !== tag) } : r)));
        const outcomes = ids.map((id) => (refused.includes(id) ? { id, ok: false, message: "This post has no front matter, so it cannot carry tags yet." } : { id, ok: true, message: changed.includes(id) ? undefined : adding ? "Already had it." : "Did not have it." }));
        return {
          ok: refused.length === 0,
          message: `${adding ? "Added" : "Removed"} the tag ${tag} ${adding ? "to" : "from"} ${changed.length} ${posts(changed.length)}${refused.length ? `; ${refused.length} refused` : ""}.`,
          outcomes,
          undo: changed.length ? { intent: adding ? "remove-tag" : "add-tag", fields: { ids: changed, tag } } : undefined,
        };
      }
      case "delete": {
        const typed = String(form.get("confirm") ?? "");
        if (typed !== String(ids.length)) {
          return {
            ok: false,
            message: "Confirm first.",
            confirm: { intent: "delete", title: `Delete ${ids.length} ${posts(ids.length)}?`, lead: "This removes them from the site and cannot be undone.", items: ids.map(title), action: `Delete ${ids.length} ${posts(ids.length)}`, typeToConfirm: String(ids.length), fields: { ids } },
          };
        }
        setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
        return { ok: true, message: `Deleted ${ids.length} ${posts(ids.length)}.`, outcomes: ids.map((id) => ({ id, ok: true })) };
      }
      case "ask-reindex":
        return { ok: true, message: "The Ask index is rebuilding; it takes about a minute." };
      default:
        return { ok: false, message: `Nothing here runs “${intent}”.` };
    }
  };
  return { rows, submit };
}

function Editor() {
  const { rows, submit } = useSite();
  return <PostsList data={dataOf(rows)} action="/posts" submit={submit} now={NOW} />;
}

const outcomeResult: IntentResult = {
  ok: false,
  message: "Added the tag capsid to 2 posts; 1 refused.",
  outcomes: [
    { id: "foxhound-release", ok: true },
    { id: "phage-lambda", ok: false, message: "This post has no front matter, so it cannot carry tags yet." },
    { id: "mention-queue", ok: true },
  ],
  undo: { intent: "remove-tag", fields: { ids: ["foxhound-release", "mention-queue"], tag: "capsid" } },
};

const confirmResult: IntentResult = {
  ok: false,
  message: "Confirm first.",
  confirm: { intent: "delete", title: "Delete 2 posts?", lead: "This removes them from the site and cannot be undone.", items: ["What a mention queue is for", "Phage lambda: lysis or lysogeny"], action: "Delete 2 posts", typeToConfirm: "2", fields: { ids: ["mention-queue", "phage-lambda"] } },
};

const reader = dataOf(ROWS.slice(0, 4), { can: { edit: false, publish: false, deleteContent: false, deleteMedia: false, decideMentions: false }, newHref: undefined, extra: undefined });
const limited = dataOf(ROWS.slice(0, 3), { offers: { delete: false, schedule: true, tags: false, duplicate: true }, query: { sort: "title" }, page: { nextCursor: "c-2", sortedOnPage: true }, counts: { all: 128, draft: 9, scheduled: 2, published: 117 }, kinds: ["post"], extra: undefined });
const emptyDrafts = dataOf([], { query: { status: "draft" }, counts: { all: 4, draft: 0, scheduled: 1, published: 3 }, extra: undefined });
const emptyMatch = dataOf([], { query: { q: "lysogeny", kind: "page" }, extra: undefined });

const mounts: Record<string, () => ReactNode> = {
  editor: () => (
    <MessageProvider>
      <Editor />
    </MessageProvider>
  ),
  outcomes: () => <PostsList data={dataOf(ROWS.slice(0, 5))} action="/posts" result={outcomeResult} now={NOW} />,
  reader: () => <PostsList data={reader} action="/posts" now={NOW} />,
  limited: () => <PostsList data={limited} action="/posts" now={NOW} labels={{ noun: "article" }} />,
  "empty-drafts": () => <PostsList data={emptyDrafts} action="/posts" now={NOW} />,
  "empty-match": () => <PostsList data={emptyMatch} action="/posts" now={NOW} />,
  confirm: () => <PostsList data={dataOf(ROWS)} action="/posts" result={confirmResult} now={NOW} />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}

const staticHost = document.getElementById("posts-static");
if (staticHost) staticHost.innerHTML = renderToStaticMarkup(<PostsList data={dataOf(ROWS.slice(0, 4))} action="/posts" now={NOW} />, { identifierPrefix: "static" });
