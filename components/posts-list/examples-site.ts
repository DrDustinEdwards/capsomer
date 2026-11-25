// The in-memory site the specimens post to: what the content kit would do through site-api,
// enough to try each action.
import { useRef, useState } from "react";
import type { IntentResult, PostRow } from "../content/content.ts";
import { NOW, ROWS } from "./examples-data.ts";

const posts = (n: number) => (n === 1 ? "post" : "posts");

interface Win {
  postsLog: Array<Record<string, string | string[]>>;
}
export const win = window as unknown as Win;
win.postsLog = [];

let copies = 0;

// The in-memory site: what the content kit would do through site-api, enough to try each action.
export function useSite(initial: PostRow[] = ROWS) {
  const [rows, setRowsState] = useState(initial);
  // The site's truth between renders: an Undo posted later reads the rows as they are then.
  const live = useRef(initial);
  const setRows = (f: (rs: PostRow[]) => PostRow[]) => {
    live.current = f(live.current);
    setRowsState(live.current);
  };
  const submit = async (form: FormData): Promise<IntentResult> => {
    const entry: Record<string, string | string[]> = {};
    for (const k of new Set(form.keys()))
      entry[k] = form.getAll(k).length > 1 ? form.getAll(k).map(String) : String(form.get(k));
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
        setRows((rs) =>
          rs.map((r) =>
            ids.includes(r.id)
              ? {
                  ...r,
                  status: to,
                  publishAt: null,
                  path: to === "draft" ? null : `/blog/${r.id}`,
                  liveHref: to === "draft" ? null : `https://example.com/blog/${r.id}`,
                }
              : r,
          ),
        );
        return intent === "unpublish"
          ? {
              ok: true,
              message: `Unpublished ${ids.length === 1 ? `“${title(ids[0] ?? "")}”` : `${ids.length} posts`}.`,
              undo: { intent: "republish", fields: { ids } },
            }
          : {
              ok: true,
              message: `Published ${ids.length === 1 ? `“${title(ids[0] ?? "")}”` : `${ids.length} posts`} again.`,
            };
      }
      case "duplicate": {
        const made = ids.map((id) => `${id}-copy-${++copies}`);
        setRows((rs) => [
          ...ids.map((id, i) => ({
            ...(rs.find((r) => r.id === id) as PostRow),
            id: made[i] ?? id,
            title: `Copy of ${title(id)}`,
            status: "draft" as const,
            path: null,
            liveHref: null,
            notes: [],
          })),
          ...rs,
        ]);
        return {
          ok: true,
          message: `Duplicated ${ids.length} ${posts(ids.length)} as drafts.`,
          undo: { intent: "remove-copies", fields: { ids: made } },
        };
      }
      case "remove-copies":
        setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
        return {
          ok: true,
          message: `Removed the ${ids.length === 1 ? "copy" : `${ids.length} copies`}.`,
        };
      case "tag-add":
      case "tag-remove": {
        if (!tag) return { ok: false, message: "Type a tag first. Nothing was changed." };
        const adding = intent === "tag-add";
        // The site refuses a post with no front matter (Carrel's bulk.server.ts does).
        const refused: string[] = ids.filter((id) => id === "spring-survey");
        const changed = ids.filter(
          (id) =>
            !refused.includes(id) &&
            (rows.find((r) => r.id === id)?.tags ?? []).includes(tag) !== adding,
        );
        setRows((rs) =>
          rs.map((r) =>
            changed.includes(r.id)
              ? {
                  ...r,
                  tags: adding ? [...(r.tags ?? []), tag] : (r.tags ?? []).filter((t) => t !== tag),
                }
              : r,
          ),
        );
        const outcomes = ids.map((id) =>
          refused.includes(id)
            ? {
                id,
                ok: false,
                message: "This post has no front matter, so it cannot carry tags yet.",
              }
            : {
                id,
                ok: true,
                message: changed.includes(id)
                  ? undefined
                  : adding
                    ? "Already had it."
                    : "Did not have it.",
              },
        );
        return {
          ok: refused.length === 0,
          message: `${adding ? "Added" : "Removed"} the tag ${tag} ${adding ? "to" : "from"} ${changed.length} ${posts(changed.length)}${refused.length ? `; ${refused.length} refused` : ""}.`,
          outcomes,
          undo: changed.length
            ? { intent: adding ? "tag-remove" : "tag-add", fields: { ids: changed, tag } }
            : undefined,
        };
      }
      case "delete": {
        const typed = String(form.get("confirm") ?? "");
        if (typed !== String(ids.length)) {
          return {
            ok: false,
            message: "Confirm first.",
            confirm: {
              intent: "delete",
              title: `Delete ${ids.length} ${posts(ids.length)}?`,
              lead: "This removes them from the site and cannot be undone.",
              items: ids.map(title),
              action: `Delete ${ids.length} ${posts(ids.length)}`,
              typeToConfirm: String(ids.length),
              fields: { ids },
            },
          };
        }
        setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
        return {
          ok: true,
          message: `Deleted ${ids.length} ${posts(ids.length)}.`,
          outcomes: ids.map((id) => ({ id, ok: true })),
        };
      }
      case "trash":
      case "restore": {
        // Each is the other's Undo, as the kit's are.
        const binning = intent === "trash";
        setRows((rs) =>
          rs.map((r) =>
            ids.includes(r.id)
              ? {
                  ...r,
                  trashedAt: binning ? new Date(NOW).toISOString() : null,
                  ...(binning ? { status: "draft" as const } : {}),
                }
              : r,
          ),
        );
        const what = ids.length === 1 ? `“${title(ids[0] ?? "")}”` : `${ids.length} posts`;
        return {
          ok: true,
          message: binning ? `Moved ${what} to Trash.` : `Restored ${what}.`,
          undo: { intent: binning ? "restore" : "trash", fields: { ids } },
        };
      }
      case "rename": {
        const id = ids[0] ?? "";
        const next = String(form.get("newId") ?? "").trim();
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(next))
          return {
            ok: false,
            message:
              "A slug is letters, digits, dots, dashes and underscores. Nothing was changed.",
          };
        if (rows.some((r) => r.id === next))
          return { ok: false, message: `The slug ${next} is taken. Nothing was changed.` };
        const old = rows.find((r) => r.id === id);
        const path = old?.path ? old.path.replace(/[^/]+$/, next) : null;
        setRows((rs) =>
          rs.map((r) =>
            r.id === id
              ? {
                  ...r,
                  id: next,
                  href: `/editor/${next}`,
                  path,
                  liveHref: path && r.liveHref ? `https://example.com${path}` : r.liveHref,
                }
              : r,
          ),
        );
        return {
          ok: true,
          message: old?.path
            ? `Renamed “${title(id)}” to ${next}. ${old.path} now redirects to ${path}.`
            : `Renamed “${title(id)}” to ${next}.`,
        };
      }
      case "preview-link": {
        const id = ids[0] ?? "";
        return {
          ok: true,
          message: `Made a preview link for “${title(id)}”. It works for 48 hours.`,
          outcomes: [{ id, ok: true }],
          previewLink: {
            url: "https://example.com/preview/Xk2fQ9bLm4TzR7wVc1nH8sJd5pYa3gUe6oKi0qWtBvE",
            expiresAt: new Date(NOW + 48 * 3600_000).toISOString(),
          },
        };
      }
      case "reschedule": {
        // One time for every post, or (its Undo) one per post in the order of ids, as the kit takes them.
        const times = form.getAll("publishAts").map(String);
        const at = (id: string) =>
          (times.length ? times[ids.indexOf(id)] : String(form.get("publishAt") ?? "")) ?? "";
        if (!ids.every((id) => /[zZ]|[+-]\d{2}:\d{2}$/.test(at(id))))
          return { ok: false, message: "Choose the new time, with its time zone." };
        const before = ids.map((id) => {
          const r = rows.find((x) => x.id === id);
          return (r?.status === "published" ? r.scheduledUpdate?.publishAt : r?.publishAt) ?? "";
        });
        setRows((rs) =>
          rs.map((r) =>
            !ids.includes(r.id)
              ? r
              : r.status === "published" && r.scheduledUpdate
                ? { ...r, scheduledUpdate: { ...r.scheduledUpdate, publishAt: at(r.id) } }
                : { ...r, publishAt: at(r.id) },
          ),
        );
        const when = `${at(ids[0] ?? "")
          .slice(0, 16)
          .replace("T", " ")} UTC`;
        return {
          ok: true,
          message:
            ids.length === 1
              ? `Rescheduled “${title(ids[0] ?? "")}” for ${when}.`
              : `Rescheduled ${ids.length} posts.`,
          undo: { intent: "reschedule", fields: { ids, publishAts: before } },
        };
      }
      case "cancel-schedule":
        setRows((rs) =>
          rs.map((r) => (ids.includes(r.id) ? { ...r, scheduledUpdate: undefined } : r)),
        );
        return {
          ok: true,
          message: `Canceled the scheduled update to “${title(ids[0] ?? "")}”; the live post stays as it is. A canceled schedule has no Undo.`,
        };
      case "ask-reindex":
        return { ok: true, message: "The Ask index is rebuilding; it takes about a minute." };
      default:
        return { ok: false, message: `Nothing here runs “${intent}”.` };
    }
  };
  return { rows, submit };
}
