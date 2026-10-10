// Mounts the specimens: MentionsList as a host would hold it, with a small in-memory site standing
// in for the content kit, and a stand-in router (links inside a specimen change its query in
// place), so every action can be tried on one page. The kit's intents and words here are a
// specimen's, not a contract; the real ones live with the kit.
import { StrictMode, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContentCan, IntentResult, MentionOffers, MentionsData, MentionsQuery } from "../content/content.ts";
import { MessageProvider } from "../message/message.react.tsx";
import { NO_UNDO_TEXT, countStates, decide, decidedText, inView, mentionsWord, sweepLines, undoAction, type Mention, type ModAction, type ModState } from "../moderation-queue/moderation-queue.ts";
import { currentView } from "./mentions-list.ts";
import { MentionsList } from "./mentions-list.react.tsx";

const NOW = Date.parse("2026-10-10T12:00:00Z");
const ALL: ContentCan = { edit: true, publish: true, deleteContent: true, deleteMedia: true, decideMentions: true };
const NONE: ContentCan = { edit: false, publish: false, deleteContent: false, deleteMedia: false, decideMentions: false };
const V06: MentionOffers = { reset: true, delete: true, sweep: true };
const V05: MentionOffers = { reset: false, delete: true, sweep: true };
const RETENTION = "This site removes a mention whose source was not found after 30 days, and a rejected one after 90 days. Waiting and approved mentions are never removed.";

const lambda = { post: "Phage lambda: lysis or lysogeny", postHref: "/editor/phage-lambda" };
const strip = { post: "Why the uptime strip counts gaps", postHref: "/editor/uptime-strip" };
const agent = { post: "Notes on a read-only agent", postHref: "/editor/read-only-agent" };

const MENTIONS: Mention[] = [
  { id: "m-101", author: "Rosa Park", host: "fieldnotes.example", url: "https://fieldnotes.example/2026/lambda-decision", excerpt: "Lysogeny is not a failure to lyse. Putting the decision as a bet on the host's condition finally made the burst size paper make sense.", ...lambda, at: "2026-10-10T10:40:00Z", state: "pending", version: "3" },
  { id: "m-102", author: "Sam Okafor", host: "bacteriophage.example", url: "https://bacteriophage.example/lab/meeting-notes", excerpt: "Cited your reading list in this week's lab meeting notes.", ...lambda, at: "2026-10-10T08:15:00Z", state: "pending", version: "2" },
  { id: "m-103", author: "An unnamed sender", host: "reader.example", url: "https://reader.example/r/4471", excerpt: "<script>alert('hello')</script> nice post, https://reader.example/click-here", ...strip, at: "2026-10-09T21:05:00Z", state: "pending", version: "1" },
  { id: "m-160", author: "Noor Haddad", host: "notes.example", url: "https://notes.example/2026/10/uptime", excerpt: "A short note on the uptime strip.", ...strip, at: "2026-10-10T11:52:00Z", state: "unverified", version: "1" },
  { id: "m-150", author: "Kai Anders", host: "oldblog.example", url: "https://oldblog.example/2026/09/lambda", excerpt: "A long reply about lambda that the author has since taken down.", ...lambda, at: "2026-09-29T20:00:00Z", state: "failed", failureReason: "The source page answered 404.", version: "2" },
  { id: "m-151", author: "Lena Ortiz", host: "gone.example", url: "https://gone.example/p/12", excerpt: "Quoted the third paragraph of the post.", ...strip, at: "2026-08-27T08:00:00Z", state: "failed", failureReason: "The source page does not link to the post.", version: "2", expiring: true },
  { id: "m-120", author: "Jon Alvarez", host: "jonalvarez.example", url: "https://jonalvarez.example/notes/agents", external: true, excerpt: "A careful account of what a read-only agent can and cannot do.", ...agent, at: "2026-09-21T10:10:00Z", decidedAt: "2026-09-22T08:00:00Z", state: "approved", version: "4" },
  { id: "m-130", author: "Cheap Pills", host: "pills.example", url: "https://pills.example/buy", excerpt: "Great post! Visit our shop for the best prices.", ...lambda, at: "2026-06-20T07:00:00Z", decidedAt: "2026-06-20T09:00:00Z", state: "rejected", version: "2", expiring: true },
  { id: "m-140", author: "Dev Patel", host: "devpatel.example", url: "https://devpatel.example/notes/phage", excerpt: "Not sure this is about the same paper at all.", ...lambda, at: "2026-09-29T15:30:00Z", decidedAt: "2026-09-30T09:00:00Z", state: "rejected", version: "3" },
];

// What the kit's loader would answer for this query: the site's counts, one page of the tab.
function load(all: Mention[], query: MentionsQuery, over: Partial<MentionsData> = {}): MentionsData {
  const counts = countStates(all);
  const view = currentView({ query, counts });
  const expiring = { failed: all.filter((m) => m.expiring && m.state === "failed").length, rejected: all.filter((m) => m.expiring && m.state === "rejected").length };
  return { site: { name: "dustinedwards.info" }, query, rows: all.filter((m) => inView(m.state, view)), page: { nextCursor: null }, counts, expiring, retention: RETENTION, offers: V06, can: ALL, ...over };
}

interface Win {
  mentionsLog: Array<Record<string, string | string[]>>;
}
const win = window as unknown as Win;
win.mentionsLog = [];

// The stand-in router: a link to the list's own address changes the specimen's query instead of
// leaving the page.
function useRouter(initial: MentionsQuery) {
  const [query, setQuery] = useState(initial);
  const onClickCapture = (e: MouseEvent) => {
    const a = (e.target as Element).closest("a[href]");
    const href = a?.getAttribute("href") ?? "";
    if (!href.startsWith("/mentions") || a?.closest(".cap-row-title")) return;
    e.preventDefault();
    setQuery(Object.fromEntries(new URL(href, location.origin).searchParams) as MentionsQuery);
  };
  return { query, onClickCapture };
}

// The in-memory site: what the content kit would do through site-api, one decide per mention in
// order, as Carrel's does.
function useSite(offers: MentionOffers) {
  const live = useRef(MENTIONS.map((m) => ({ ...m })));
  const [, redraw] = useState(0);
  const set = (next: Mention[]) => {
    live.current = next;
    redraw((n) => n + 1);
  };
  const submit = async (form: FormData): Promise<IntentResult> => {
    const entry: Record<string, string | string[]> = {};
    for (const k of new Set(form.keys())) entry[k] = form.getAll(k).length > 1 ? form.getAll(k).map(String) : String(form.get(k));
    win.mentionsLog.push(entry);
    await new Promise((r) => setTimeout(r, 40));
    const intent = String(form.get("intent"));
    const ids = form.getAll("ids").map(String);
    const all = live.current;
    const byId = (id: string) => all.find((m) => m.id === id);
    const who = (id: string) => byId(id)?.author ?? id;
    switch (intent) {
      case "approve":
      case "reject":
      case "reset": {
        const action = intent as ModAction;
        const moved: Array<{ id: string; from: ModState }> = [];
        const outcomes = ids.map((id) => {
          const m = byId(id);
          const to = m ? decide(m.state, action, offers.reset) : null;
          if (!m || !to) return { id, ok: false, message: m && (m.state === "unverified" || m.state === "failed") ? "The site cannot decide a mention not yet checked or whose source was not found." : "Nothing to change." };
          moved.push({ id, from: m.state });
          return { id, ok: true };
        });
        set(all.map((m) => {
          const t = moved.find((x) => x.id === m.id);
          const to = t ? decide(m.state, action, offers.reset) : null;
          return t && to ? { ...m, state: to, decidedAt: to === "pending" ? undefined : new Date(NOW).toISOString() } : m;
        }));
        const text = moved.length ? decidedText(action, moved.map((x) => who(x.id))) : "Nothing was changed.";
        const back = moved.every((x) => undoAction(x.from, offers.reset));
        return {
          ok: outcomes.every((o) => o.ok),
          message: moved.length && !back ? `${text} ${NO_UNDO_TEXT}` : text,
          outcomes,
          undo: moved.length && back ? { intent: "put-back", fields: { ids: moved.map((x) => x.id), states: moved.map((x) => x.from) } } : undefined,
        };
      }
      case "put-back": {
        const states = form.getAll("states").map(String) as ModState[];
        set(all.map((m) => {
          const i = ids.indexOf(m.id);
          const to = states[i];
          return i >= 0 && to ? { ...m, state: to, decidedAt: to === "pending" ? undefined : m.decidedAt } : m;
        }));
        return { ok: true, message: ids.length === 1 ? `The mention from ${who(ids[0] ?? "")} is back where it was.` : `${ids.length} mentions are back where they were.` };
      }
      case "delete": {
        if (String(form.get("confirm") ?? "") !== String(ids.length)) {
          const n = ids.length;
          return { ok: false, message: "Confirm first.", confirm: { intent: "delete", title: n === 1 ? `Delete the mention from ${who(ids[0] ?? "")}?` : `Delete ${n} mentions?`, lead: "This cannot be undone. Reject it instead to keep it off the post and keep the record.", items: ids.map((id) => `From ${who(id)} (${byId(id)?.host ?? ""})`), action: `Delete ${n} ${mentionsWord(n)}`, typeToConfirm: String(n), fields: { ids } } };
        }
        set(all.filter((m) => !ids.includes(m.id)));
        return { ok: true, message: ids.length === 1 ? `Deleted the mention from ${who(ids[0] ?? "")}.` : `Deleted ${ids.length} mentions.`, outcomes: ids.map((id) => ({ id, ok: true })) };
      }
      case "sweep": {
        const doomed = all.filter((m) => m.expiring);
        const expiring = { failed: doomed.filter((m) => m.state === "failed").length, rejected: doomed.filter((m) => m.state === "rejected").length };
        if (!form.get("confirmed")) {
          return { ok: false, message: "Confirm first.", confirm: { intent: "sweep", title: `Remove ${doomed.length} expired ${mentionsWord(doomed.length)}?`, lead: "This cannot be undone. Nothing that is waiting or approved is touched.", items: sweepLines(expiring), action: "Remove them", fields: { confirmed: "yes" } } };
        }
        set(all.filter((m) => !m.expiring));
        return { ok: true, message: `Removed ${doomed.length} expired ${mentionsWord(doomed.length)}.` };
      }
      default:
        return { ok: false, message: `Nothing here runs “${intent}”.` };
    }
  };
  return { mentions: live.current, submit };
}

function Owner({ offers }: { offers: MentionOffers }) {
  const { mentions, submit } = useSite(offers);
  const { query, onClickCapture } = useRouter({});
  return (
    <div onClickCapture={onClickCapture}>
      <MentionsList data={load(mentions, query, { offers })} action="/mentions" submit={submit} now={NOW} />
    </div>
  );
}

const outcomeResult: IntentResult = {
  ok: false,
  message: "Approved 2 mentions.",
  outcomes: [
    { id: "m-101", ok: true },
    { id: "m-103", ok: false, message: "It changed since the page was read, so nothing was done to it. Look again and decide." },
    { id: "m-102", ok: true },
  ],
  undo: { intent: "reset", fields: { ids: ["m-101", "m-102"] } },
};

const confirmDelete: IntentResult = {
  ok: false,
  message: "Confirm first.",
  confirm: { intent: "delete", title: "Delete 2 mentions?", lead: "This cannot be undone. Reject it instead to keep it off the post and keep the record.", items: ["From Cheap Pills (pills.example)", "From Dev Patel (devpatel.example)"], action: "Delete 2 mentions", typeToConfirm: "2", fields: { ids: ["m-130", "m-140"] } },
};

const confirmSweep: IntentResult = {
  ok: false,
  message: "Confirm first.",
  confirm: { intent: "sweep", title: "Remove 2 expired mentions?", lead: "This cannot be undone. Nothing that is waiting or approved is touched.", items: sweepLines({ failed: 1, rejected: 1 }), action: "Remove them", fields: { confirmed: "yes" } },
};

const decided = MENTIONS.filter((m) => m.state !== "pending");

const mounts: Record<string, () => ReactNode> = {
  editor: () => (
    <MessageProvider>
      <Owner offers={V06} />
    </MessageProvider>
  ),
  v05: () => (
    <MessageProvider>
      <Owner offers={V05} />
    </MessageProvider>
  ),
  outcomes: () => <MentionsList data={load(MENTIONS, {})} action="/mentions" result={outcomeResult} now={NOW} />,
  reader: () => <MentionsList data={load(MENTIONS, {}, { can: NONE })} action="/mentions" now={NOW} />,
  paged: () => (
    <MentionsList
      data={load(MENTIONS, { view: "all", cursor: "c-2", open: "m-120" }, { counts: { unverified: 3, pending: 41, approved: 152, rejected: 18, failed: 9, all: 223 }, page: { nextCursor: "c-3" }, offers: V05 })}
      action="/mentions"
      now={NOW}
    />
  ),
  "empty-open": () => <MentionsList data={load(decided, {})} action="/mentions" now={NOW} />,
  "empty-rejected": () => <MentionsList data={load(MENTIONS.filter((m) => m.state !== "rejected"), { view: "rejected" })} action="/mentions" now={NOW} />,
  "confirm-delete": () => <MentionsList data={load(MENTIONS, { view: "rejected" })} action="/mentions" result={confirmDelete} now={NOW} />,
  "confirm-sweep": () => <MentionsList data={load(MENTIONS, {})} action="/mentions" result={confirmSweep} now={NOW} />,
};

for (const el of document.querySelectorAll<HTMLElement>("[data-mount]")) {
  const make = mounts[el.dataset.mount ?? ""];
  if (make) createRoot(el).render(<StrictMode>{make()}</StrictMode>);
}

const staticHost = document.getElementById("mentions-static");
if (staticHost) staticHost.innerHTML = renderToStaticMarkup(<MentionsList data={load(MENTIONS.slice(0, 4), {})} action="/mentions" now={NOW} />, { identifierPrefix: "static" });
