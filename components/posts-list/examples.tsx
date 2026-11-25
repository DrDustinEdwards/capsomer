// Mounts the specimens: PostsList as a host would hold it, with a small in-memory site standing in
// for the content kit, so every action can be tried. The kit's intents and words here are a
// specimen's, not a contract; the real ones live with the kit.
import { StrictMode, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { IntentResult, PostRow, ScheduledUpdateView } from "../content/content.ts";
import { MessageProvider } from "../message/message.react.tsx";
import { PostScheduledUpdate, PostsList } from "./posts-list.react.tsx";
import { setStaticHtml } from "../trusted-html/trusted-html.ts";
import { ALL, IDEAS, IDEA_ROWS, NOW, ROWS, dataOf } from "./examples-data.ts";
import { useSite, win } from "./examples-site.ts";

function Editor() {
  const { rows, submit } = useSite();
  return <PostsList data={dataOf(rows)} action="/posts" submit={submit} now={NOW} />;
}

// A site that keeps an update waiting on a live post (site-api v0.10.0): the row says so, and its
// menu moves or cancels it.
function Updates() {
  const { rows, submit } = useSite();
  return (
    <PostsList
      data={dataOf(rows.slice(1, 4), {
        offers: {
          delete: true,
          schedule: true,
          tags: true,
          duplicate: true,
          scheduledUpdates: true,
        },
        extra: undefined,
      })}
      action="/posts"
      submit={submit}
      now={NOW}
    />
  );
}

const LIVE =
  "A read-only agent can look but not touch. It reads the knowledge base and the repositories, and it writes nothing. That makes it safe to leave running.";
const UPDATE =
  "A read-only agent can look but not touch. It reads the knowledge base and the repositories, and it writes nothing but its own notes. That makes it safe to leave running overnight.";
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

const CRUMBS = [
  { label: "Posts", href: "/posts" },
  { label: "Notes on a read-only agent", href: "/editor/read-only-agent" },
  { label: "Scheduled update" },
];

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
    if (!at.endsWith("Z"))
      return { ok: false, message: "Choose the new time, with its time zone." };
    const when = `${at.slice(0, 16).replace("T", " ")} UTC`;
    setData((d) => (d ? { ...d, publishAt: at, when } : d));
    return { ok: true, message: `Rescheduled for ${when}.` };
  };
  if (!data)
    return (
      <p>
        Nothing is scheduled for this post now. <a href="/posts">Back to the list</a>
      </p>
    );
  return (
    <PostScheduledUpdate
      data={data}
      action="/posts"
      submit={submit}
      liveSince="2026-09-21T10:00:00Z"
      crumbs={CRUMBS}
      headingLevel="h3"
      now={NOW}
    />
  );
}

const outcomeResult: IntentResult = {
  ok: false,
  message: "Added the tag capsid to 2 posts; 1 refused.",
  outcomes: [
    { id: "spring-release", ok: true },
    {
      id: "spring-survey",
      ok: false,
      message: "This post has no front matter, so it cannot carry tags yet.",
    },
    { id: "mention-queue", ok: true },
  ],
  undo: {
    intent: "tag-remove",
    fields: { ids: ["spring-release", "mention-queue"], tag: "capsid" },
  },
};

// The v0.15.0 site, live or its Trash, with every action.
function Ideas({ trash = false }: { trash?: boolean }) {
  const { rows, submit } = useSite(IDEA_ROWS);
  const live = rows.filter((r) => !r.trashedAt);
  const binned = rows.filter((r) => r.trashedAt);
  const count = (s: PostRow["status"]) => live.filter((r) => r.status === s).length;
  const counts = {
    all: live.length,
    draft: count("draft"),
    scheduled: count("scheduled"),
    published: count("published"),
    trash: binned.length,
  };
  return (
    <PostsList
      data={dataOf(trash ? binned : live, {
        offers: IDEAS,
        query: trash ? { trashed: "1" } : {},
        counts,
        extra: undefined,
      })}
      action="/posts"
      submit={submit}
      now={NOW}
    />
  );
}

// The same site's list as a server sends it after the filters were used, and after a preview link
// was made with no script.
const ideaRows = IDEA_ROWS.filter((r) => !r.trashedAt);
const ideaCounts = { all: 4, draft: 1, scheduled: 1, published: 2, trash: 2 };
const filteredIdeas = dataOf(
  ideaRows.filter((r) => r.authors?.includes("Sam Lee")),
  {
    offers: IDEAS,
    query: { author: "Sam Lee", from: "2026-09-01", to: "2026-10-31" },
    counts: ideaCounts,
    extra: undefined,
  },
);
const linkResult: IntentResult = {
  ok: true,
  message: "Made a preview link for “Why the uptime strip counts gaps”. It works for 48 hours.",
  outcomes: [{ id: "uptime-strip", ok: true }],
  previewLink: {
    url: "https://example.com/preview/Xk2fQ9bLm4TzR7wVc1nH8sJd5pYa3gUe6oKi0qWtBvE",
    expiresAt: "2026-10-12T12:00:00Z",
  },
};

const confirmResult: IntentResult = {
  ok: false,
  message: "Confirm first.",
  confirm: {
    intent: "delete",
    title: "Delete 2 posts?",
    lead: "This removes them from the site and cannot be undone.",
    items: ["What a mention queue is for", "Field notes: the spring survey"],
    action: "Delete 2 posts",
    typeToConfirm: "2",
    fields: { ids: ["mention-queue", "spring-survey"] },
  },
};

const reader = dataOf(ROWS.slice(0, 4), {
  can: {
    edit: false,
    publish: false,
    deleteContent: false,
    deleteMedia: false,
    decideMentions: false,
  },
  newHref: undefined,
  extra: undefined,
});
const limited = dataOf(ROWS.slice(0, 3), {
  offers: { delete: false, schedule: true, tags: false, duplicate: true },
  query: { sort: "title" },
  page: { nextCursor: "c-2", sortedOnPage: true },
  counts: { all: 128, draft: 9, scheduled: 2, published: 117 },
  kinds: ["post"],
  extra: undefined,
});
const emptyDrafts = dataOf([], {
  query: { status: "draft" },
  counts: { all: 4, draft: 0, scheduled: 1, published: 3 },
  extra: undefined,
});
const emptyMatch = dataOf([], { query: { q: "lighthouse", kind: "page" }, extra: undefined });

const mounts: Record<string, () => ReactNode> = {
  editor: () => (
    <MessageProvider>
      <Editor />
    </MessageProvider>
  ),
  outcomes: () => (
    <PostsList data={dataOf(ROWS.slice(0, 5))} action="/posts" result={outcomeResult} now={NOW} />
  ),
  reader: () => <PostsList data={reader} action="/posts" now={NOW} />,
  limited: () => (
    <PostsList data={limited} action="/posts" now={NOW} labels={{ noun: "article" }} />
  ),
  "empty-drafts": () => <PostsList data={emptyDrafts} action="/posts" now={NOW} />,
  "empty-match": () => <PostsList data={emptyMatch} action="/posts" now={NOW} />,
  confirm: () => <PostsList data={dataOf(ROWS)} action="/posts" result={confirmResult} now={NOW} />,
  updates: () => <Updates />,
  ideas: () => <Ideas />,
  "ideas-filtered": () => <PostsList data={filteredIdeas} action="/posts" now={NOW} />,
  "ideas-trash": () => <Ideas trash />,
  "ideas-link": () => (
    <PostsList
      data={dataOf(ideaRows, { offers: IDEAS, counts: ideaCounts, extra: undefined })}
      action="/posts"
      result={linkResult}
      now={NOW}
    />
  ),
  "update-view": () => <UpdateView />,
  "update-reader": () => (
    <PostScheduledUpdate
      data={{ ...UPDATE_VIEW, can: { ...ALL, edit: false, publish: false } }}
      action="/posts"
      liveSince="2026-09-21T10:00:00Z"
      crumbs={CRUMBS}
      headingLevel="h3"
      now={NOW}
    />
  ),
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}

const staticHost = document.getElementById("posts-static");
if (staticHost)
  setStaticHtml(
    staticHost,
    renderToStaticMarkup(<PostsList data={dataOf(ROWS.slice(0, 4))} action="/posts" now={NOW} />, {
      identifierPrefix: "static",
    }),
  );
