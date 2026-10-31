// Mounts the specimens: PostsList as a host would hold it, with a small in-memory site standing in
// for the content kit, so every action can be tried. The kit's intents and words here are a
// specimen's, not a contract; the real ones live with the kit.
import { StrictMode, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContentCan, IntentResult, PostOffers, PostRow, PostsData, ScheduledUpdateView } from "../content/content.ts";
import { MessageProvider } from "../message/message.react.tsx";
import { PostScheduledUpdate, PostsList } from "./posts-list.react.tsx";

const NOW = Date.parse("2026-10-10T12:00:00Z");
const ALL: ContentCan = { edit: true, publish: true, deleteContent: true, deleteMedia: true, decideMentions: true };

const ROWS: PostRow[] = [
  { id: "spring-release", title: "Notes on the spring release", kind: "post", status: "published", path: "/blog/spring-release", href: "/editor/spring-release", liveHref: "https://example.com/blog/spring-release", publishAt: null, publishedAt: "2026-10-02T09:00:00Z", updatedAt: "2026-10-09T16:20:00Z", tags: ["release"] },
  { id: "uptime-strip", title: "Why the uptime strip counts gaps", kind: "post", status: "scheduled", path: null, href: "/editor/uptime-strip", liveHref: null, publishAt: "2026-10-13T08:00:00Z", publishedAt: null, updatedAt: "2026-10-10T08:05:00Z", tags: ["capsid"] },
  { id: "mention-queue", title: "What a mention queue is for", kind: "post", status: "draft", path: null, href: "/editor/mention-queue", liveHref: null, publishAt: null, publishedAt: null, updatedAt: "2026-10-08T21:40:00Z", notes: [{ text: "2 AI drafts waiting", tone: "info" }], tags: [] },
  { id: "read-only-agent", title: "Notes on a read-only agent", kind: "post", status: "published", path: "/blog/read-only-agent", href: "/editor/read-only-agent", liveHref: "https://example.com/blog/read-only-agent", publishAt: null, publishedAt: "2026-09-21T10:00:00Z", updatedAt: "2026-09-22T08:00:00Z", scheduledUpdate: { publishAt: "2026-10-12T15:00:00Z", href: "/posts/read-only-agent/update" }, tags: ["agents", "capsid"] },
  { id: "spring-survey", title: "Field notes: the spring survey", kind: "post", status: "draft", path: null, href: "/editor/spring-survey", liveHref: null, publishAt: null, publishedAt: null, updatedAt: "2026-10-01T12:00:00Z", notes: [{ text: "New draft" }, { text: "Held by a flag", tone: "warn" }] },
  { id: "about", title: "About", kind: "page", status: "published", path: "/about", href: "/editor/about", liveHref: "https://example.com/about", publishAt: null, publishedAt: "2026-06-01T09:00:00Z", updatedAt: "2026-09-02T11:00:00Z", tags: [] },
];

// A site with site-api v0.17.0's ideas: a Trash, rename, preview links, the author and date
// filters, and rows that carry their authors and excerpt.
const IDEAS: PostOffers = { delete: true, schedule: true, tags: true, duplicate: true, trash: true, rename: true, previewLinks: true, filters: ["kind", "tag", "author", "published", "trashed"], authors: ["Alex Rivera", "Sam Lee"] };
const CREDITS: Record<string, Pick<PostRow, "authors" | "excerpt">> = {
  "spring-release": { authors: ["Alex Rivera"], excerpt: "What shipped in the spring release, what was cut, and the one migration that needs a hand." },
  "uptime-strip": { authors: ["Alex Rivera", "Sam Lee"], excerpt: "A gap is not a zero: the strip draws a missing check as its own state, with the reason." },
  "mention-queue": { authors: ["Sam Lee"] },
  "read-only-agent": { authors: ["Alex Rivera"], excerpt: "An agent that reads the knowledge base and the repositories and writes nothing but its own notes is safe to leave running overnight, which is most of what makes it useful." },
};
const IDEA_ROWS: PostRow[] = [
  ...ROWS.slice(0, 4).map((r) => ({ ...r, ...CREDITS[r.id], scheduledUpdate: undefined, trashedAt: null })),
  { id: "old-survey-notes", title: "Old notes on the survey", kind: "post", status: "draft", path: null, href: "/editor/old-survey-notes", liveHref: null, publishAt: null, publishedAt: null, updatedAt: "2026-08-14T10:00:00Z", authors: ["Alex Rivera"], trashedAt: "2026-10-08T09:00:00Z" },
  { id: "docs-launch", title: "The docs site is open", kind: "post", status: "draft", path: "/blog/docs-launch", href: "/editor/docs-launch", liveHref: null, publishAt: null, publishedAt: "2026-05-02T09:00:00Z", updatedAt: "2026-09-30T15:00:00Z", authors: ["Sam Lee", "Alex Rivera"], excerpt: "The new home for every guide we write, and what it will never do to your prose.", trashedAt: "2026-09-20T12:00:00Z" },
];

const WORDS: Record<string, string> = { "spring-release": "1,240", "uptime-strip": "860", "mention-queue": "1,530", "read-only-agent": "2,110", "spring-survey": "3,020", about: "410" };

function dataOf(rows: PostRow[], over: Partial<PostsData> = {}): PostsData {
  const count = (s: PostRow["status"]) => rows.filter((r) => r.status === s).length;
  return {
    site: { name: "example.com" },
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
function useSite(initial: PostRow[] = ROWS) {
  const [rows, setRowsState] = useState(initial);
  // The site's truth between renders: an Undo posted later reads the rows as they are then.
  const live = useRef(initial);
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
        setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status: to, publishAt: null, path: to === "draft" ? null : `/blog/${r.id}`, liveHref: to === "draft" ? null : `https://example.com/blog/${r.id}` } : r)));
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
      case "tag-add":
      case "tag-remove": {
        if (!tag) return { ok: false, message: "Type a tag first. Nothing was changed." };
        const adding = intent === "tag-add";
        // The site refuses a post with no front matter (Carrel's bulk.server.ts does).
        const refused: string[] = ids.filter((id) => id === "spring-survey");
        const changed = ids.filter((id) => !refused.includes(id) && (rows.find((r) => r.id === id)?.tags ?? []).includes(tag) !== adding);
        setRows((rs) => rs.map((r) => (changed.includes(r.id) ? { ...r, tags: adding ? [...(r.tags ?? []), tag] : (r.tags ?? []).filter((t) => t !== tag) } : r)));
        const outcomes = ids.map((id) => (refused.includes(id) ? { id, ok: false, message: "This post has no front matter, so it cannot carry tags yet." } : { id, ok: true, message: changed.includes(id) ? undefined : adding ? "Already had it." : "Did not have it." }));
        return {
          ok: refused.length === 0,
          message: `${adding ? "Added" : "Removed"} the tag ${tag} ${adding ? "to" : "from"} ${changed.length} ${posts(changed.length)}${refused.length ? `; ${refused.length} refused` : ""}.`,
          outcomes,
          undo: changed.length ? { intent: adding ? "tag-remove" : "tag-add", fields: { ids: changed, tag } } : undefined,
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
      case "trash":
      case "restore": {
        // Each is the other's Undo, as the kit's are.
        const binning = intent === "trash";
        setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, trashedAt: binning ? new Date(NOW).toISOString() : null, ...(binning ? { status: "draft" as const } : {}) } : r)));
        const what = ids.length === 1 ? `“${title(ids[0] ?? "")}”` : `${ids.length} posts`;
        return { ok: true, message: binning ? `Moved ${what} to Trash.` : `Restored ${what}.`, undo: { intent: binning ? "restore" : "trash", fields: { ids } } };
      }
      case "rename": {
        const id = ids[0] ?? "";
        const next = String(form.get("newId") ?? "").trim();
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(next)) return { ok: false, message: "A slug is letters, digits, dots, dashes and underscores. Nothing was changed." };
        if (rows.some((r) => r.id === next)) return { ok: false, message: `The slug ${next} is taken. Nothing was changed.` };
        const old = rows.find((r) => r.id === id);
        const path = old?.path ? old.path.replace(/[^/]+$/, next) : null;
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, id: next, href: `/editor/${next}`, path, liveHref: path && r.liveHref ? `https://example.com${path}` : r.liveHref } : r)));
        return { ok: true, message: old?.path ? `Renamed “${title(id)}” to ${next}. ${old.path} now redirects to ${path}.` : `Renamed “${title(id)}” to ${next}.` };
      }
      case "preview-link": {
        const id = ids[0] ?? "";
        return {
          ok: true,
          message: `Made a preview link for “${title(id)}”. It works for 48 hours.`,
          outcomes: [{ id, ok: true }],
          previewLink: { url: "https://example.com/preview/Xk2fQ9bLm4TzR7wVc1nH8sJd5pYa3gUe6oKi0qWtBvE", expiresAt: new Date(NOW + 48 * 3600_000).toISOString() },
        };
      }
      case "reschedule": {
        // One time for every post, or (its Undo) one per post in the order of ids, as the kit takes them.
        const times = form.getAll("publishAts").map(String);
        const at = (id: string) => (times.length ? times[ids.indexOf(id)] : String(form.get("publishAt") ?? "")) ?? "";
        if (!ids.every((id) => /[zZ]|[+-]\d{2}:\d{2}$/.test(at(id)))) return { ok: false, message: "Choose the new time, with its time zone." };
        const before = ids.map((id) => {
          const r = rows.find((x) => x.id === id);
          return (r?.status === "published" ? r.scheduledUpdate?.publishAt : r?.publishAt) ?? "";
        });
        setRows((rs) => rs.map((r) => (!ids.includes(r.id) ? r : r.status === "published" && r.scheduledUpdate ? { ...r, scheduledUpdate: { ...r.scheduledUpdate, publishAt: at(r.id) } } : { ...r, publishAt: at(r.id) })));
        const when = `${at(ids[0] ?? "").slice(0, 16).replace("T", " ")} UTC`;
        return { ok: true, message: ids.length === 1 ? `Rescheduled “${title(ids[0] ?? "")}” for ${when}.` : `Rescheduled ${ids.length} posts.`, undo: { intent: "reschedule", fields: { ids, publishAts: before } } };
      }
      case "cancel-schedule":
        setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, scheduledUpdate: undefined } : r)));
        return { ok: true, message: `Canceled the scheduled update to “${title(ids[0] ?? "")}”; the live post stays as it is. A canceled schedule has no Undo.` };
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

// A site that keeps an update waiting on a live post (site-api v0.10.0): the row says so, and its
// menu moves or cancels it.
function Updates() {
  const { rows, submit } = useSite();
  return <PostsList data={dataOf(rows.slice(1, 4), { offers: { delete: true, schedule: true, tags: true, duplicate: true, scheduledUpdates: true }, extra: undefined })} action="/posts" submit={submit} now={NOW} />;
}

const LIVE = "A read-only agent can look but not touch. It reads the knowledge base and the repositories, and it writes nothing. That makes it safe to leave running.";
const UPDATE = "A read-only agent can look but not touch. It reads the knowledge base and the repositories, and it writes nothing but its own notes. That makes it safe to leave running overnight.";
const PATCH = `--- read-only-agent (live)
+++ read-only-agent (scheduled)
@@ -1 +1 @@
-${LIVE}
+${UPDATE}
`;
const UPDATE_VIEW: ScheduledUpdateView = {
  id: "read-only-agent",
  title: "Notes on a read-only agent",
  publishAt: "2026-10-12T15:00:00Z",
  when: "2026-10-12 15:00 UTC",
  scheduledAt: "2026-10-09T18:30:00Z",
  source: UPDATE,
  live: { source: LIVE, version: "v-7f3a", href: "https://example.com/blog/read-only-agent" },
  patch: PATCH,
  editorHref: "/editor/read-only-agent?update=1",
  can: ALL,
};

const CRUMBS = [{ label: "Posts", href: "/posts" }, { label: "Notes on a read-only agent", href: "/editor/read-only-agent" }, { label: "Scheduled update" }];

// The page of one waiting update, with a host that moves it and cancels it.
function UpdateView() {
  const [data, setData] = useState<ScheduledUpdateView | null>(UPDATE_VIEW);
  const submit = async (form: FormData): Promise<IntentResult> => {
    const entry: Record<string, string | string[]> = {};
    for (const k of new Set(form.keys())) entry[k] = String(form.get(k));
    win.postsLog.push(entry);
    await new Promise((r) => setTimeout(r, 40));
    if (form.get("intent") === "cancel-schedule") {
      setData(null);
      return { ok: true, message: "Canceled the scheduled update; the live post stays as it is." };
    }
    const at = String(form.get("publishAt") ?? "");
    if (!/Z$/.test(at)) return { ok: false, message: "Choose the new time, with its time zone." };
    const when = `${at.slice(0, 16).replace("T", " ")} UTC`;
    setData((d) => (d ? { ...d, publishAt: at, when } : d));
    return { ok: true, message: `Rescheduled for ${when}.` };
  };
  if (!data) return <p>Nothing is scheduled for this post now. <a href="/posts">Back to the list</a></p>;
  return <PostScheduledUpdate data={data} action="/posts" submit={submit} liveSince="2026-09-21T10:00:00Z" crumbs={CRUMBS} headingLevel="h3" now={NOW} />;
}

const outcomeResult: IntentResult = {
  ok: false,
  message: "Added the tag capsid to 2 posts; 1 refused.",
  outcomes: [
    { id: "spring-release", ok: true },
    { id: "spring-survey", ok: false, message: "This post has no front matter, so it cannot carry tags yet." },
    { id: "mention-queue", ok: true },
  ],
  undo: { intent: "tag-remove", fields: { ids: ["spring-release", "mention-queue"], tag: "capsid" } },
};

// The v0.15.0 site, live or its Trash, with every action.
function Ideas({ trash = false }: { trash?: boolean }) {
  const { rows, submit } = useSite(IDEA_ROWS);
  const live = rows.filter((r) => !r.trashedAt);
  const binned = rows.filter((r) => r.trashedAt);
  const count = (s: PostRow["status"]) => live.filter((r) => r.status === s).length;
  const counts = { all: live.length, draft: count("draft"), scheduled: count("scheduled"), published: count("published"), trash: binned.length };
  return <PostsList data={dataOf(trash ? binned : live, { offers: IDEAS, query: trash ? { trashed: "1" } : {}, counts, extra: undefined })} action="/posts" submit={submit} now={NOW} />;
}

// The same site's list as a server sends it after the filters were used, and after a preview link
// was made with no script.
const ideaRows = IDEA_ROWS.filter((r) => !r.trashedAt);
const ideaCounts = { all: 4, draft: 1, scheduled: 1, published: 2, trash: 2 };
const filteredIdeas = dataOf(
  ideaRows.filter((r) => r.authors?.includes("Sam Lee")),
  { offers: IDEAS, query: { author: "Sam Lee", from: "2026-09-01", to: "2026-10-31" }, counts: ideaCounts, extra: undefined },
);
const linkResult: IntentResult = {
  ok: true,
  message: "Made a preview link for “Why the uptime strip counts gaps”. It works for 48 hours.",
  outcomes: [{ id: "uptime-strip", ok: true }],
  previewLink: { url: "https://example.com/preview/Xk2fQ9bLm4TzR7wVc1nH8sJd5pYa3gUe6oKi0qWtBvE", expiresAt: "2026-10-12T12:00:00Z" },
};

const confirmResult: IntentResult = {
  ok: false,
  message: "Confirm first.",
  confirm: { intent: "delete", title: "Delete 2 posts?", lead: "This removes them from the site and cannot be undone.", items: ["What a mention queue is for", "Field notes: the spring survey"], action: "Delete 2 posts", typeToConfirm: "2", fields: { ids: ["mention-queue", "spring-survey"] } },
};

const reader = dataOf(ROWS.slice(0, 4), { can: { edit: false, publish: false, deleteContent: false, deleteMedia: false, decideMentions: false }, newHref: undefined, extra: undefined });
const limited = dataOf(ROWS.slice(0, 3), { offers: { delete: false, schedule: true, tags: false, duplicate: true }, query: { sort: "title" }, page: { nextCursor: "c-2", sortedOnPage: true }, counts: { all: 128, draft: 9, scheduled: 2, published: 117 }, kinds: ["post"], extra: undefined });
const emptyDrafts = dataOf([], { query: { status: "draft" }, counts: { all: 4, draft: 0, scheduled: 1, published: 3 }, extra: undefined });
const emptyMatch = dataOf([], { query: { q: "lighthouse", kind: "page" }, extra: undefined });

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
  updates: () => <Updates />,
  ideas: () => <Ideas />,
  "ideas-filtered": () => <PostsList data={filteredIdeas} action="/posts" now={NOW} />,
  "ideas-trash": () => <Ideas trash />,
  "ideas-link": () => <PostsList data={dataOf(ideaRows, { offers: IDEAS, counts: ideaCounts, extra: undefined })} action="/posts" result={linkResult} now={NOW} />,
  "update-view": () => <UpdateView />,
  "update-reader": () => <PostScheduledUpdate data={{ ...UPDATE_VIEW, can: { ...ALL, edit: false, publish: false } }} action="/posts" liveSince="2026-09-21T10:00:00Z" crumbs={CRUMBS} headingLevel="h3" now={NOW} />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}

const staticHost = document.getElementById("posts-static");
if (staticHost) staticHost.innerHTML = renderToStaticMarkup(<PostsList data={dataOf(ROWS.slice(0, 4))} action="/posts" now={NOW} />, { identifierPrefix: "static" });
