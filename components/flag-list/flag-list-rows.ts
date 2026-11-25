// The flag list's rows as the DOM shows them: read a flag back from its row and draw a row from its data
// (flag-list.ts decides when).
import { statusEl } from "../status/status.ts";
import { enhance as enhanceTime, parse as parseTime, text as timeText } from "../time/time.ts";
import { type Flag, type Resolution, anchorStatus } from "./flag-list-model.ts";

export const part = <T extends HTMLElement = HTMLElement>(el: ParentNode, name: string) =>
  el.querySelector<T>(`[data-cap-part='${name}']`);

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// A flag read back from its row, so the DOM stays the one source of truth.
export function readFlag(li: HTMLElement): Flag {
  const quote = li.querySelector(".cap-flag-quote-text")?.textContent ?? "";
  const after = li.querySelector(".cap-flag-after-text")?.textContent;
  const anchorId = li.dataset.anchorId;
  const flag: Flag = {
    id: li.dataset.flag ?? li.id,
    kind: li.dataset.kind === "advisory" ? "advisory" : "blocking",
    cause: part(li, "cause")?.textContent ?? "",
    message: li.querySelector(".cap-flag-message")?.textContent ?? "",
    state: li.dataset.state === "resolved" ? "resolved" : "open",
  };
  if (anchorId && quote) {
    flag.anchor = { id: anchorId, quote, lost: li.dataset.anchor === "lost" };
    if (li.dataset.before) flag.anchor.before = li.dataset.before;
    if (li.dataset.after) flag.anchor.after = li.dataset.after;
    const label = li.dataset.gotoLabel;
    if (label) flag.anchor.label = label;
  }
  if (after !== undefined && after !== null) flag.suggestion = { replacement: after };
  if (li.dataset.resolution) flag.resolution = li.dataset.resolution as Resolution;
  if (li.dataset.resolvedBy) flag.resolvedBy = li.dataset.resolvedBy;
  if (li.dataset.resolvedAt) flag.resolvedAt = li.dataset.resolvedAt;
  return flag;
}

export function flagRows(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("li.cap-flag"));
}

export function readFlags(root: ParentNode): Flag[] {
  return flagRows(root).map(readFlag);
}

const WORDS: Record<Resolution, string> = {
  resolved: "Resolved",
  dismissed: "Dismissed",
  applied: "Applied",
};

function actionButton(
  kind: string,
  label: string,
  message: string,
  variant?: string,
): HTMLButtonElement {
  const b = el("button", "cap-btn");
  b.type = "button";
  b.dataset.size = "sm";
  if (variant) b.dataset.variant = variant;
  b.dataset.capPart = kind;
  b.append(label, Object.assign(el("span", "cap-sr-only"), { textContent: ` flag: ${message}` }));
  return b;
}

export interface Ctx {
  owner: boolean;
  ownerName: string;
}

// Rebuilds the parts of one row that depend on its state and anchor, from its data attributes:
// the critical edge, the title (a link only while the passage is there), the resolution on the
// right, the actions, the suggestion's footer, and the line that says who closed it and when.
export function renderFlag(li: HTMLElement, ctx: Ctx): void {
  const flag = readFlag(li);
  const status = anchorStatus(flag);
  li.dataset.anchor = status;
  if (flag.kind === "blocking" && flag.state === "open") li.dataset.tone = "crit";
  else delete li.dataset.tone;

  // Title: the link while the passage is found; plain words and "Anchor lost" otherwise.
  const title = li.querySelector<HTMLElement>(".cap-row-title");
  if (title && flag.anchor) {
    const describedby =
      li.querySelector(".cap-row-title [aria-describedby]")?.getAttribute("aria-describedby") ??
      `${li.id}-s ${li.id}-d`;
    const message = el("span", "cap-flag-message", flag.message);
    if (status === "found") {
      const a = el("a");
      a.href = `#${flag.anchor.id}`;
      a.setAttribute("aria-describedby", describedby);
      a.append(message, " ", el("span", "cap-flag-goto", flag.anchor.label ?? "Go to passage"));
      title.replaceChildren(a);
    } else {
      const span = el("span", "cap-flag-title");
      span.append(message, " ", statusEl("nodata", "Anchor lost"));
      title.replaceChildren(span);
    }
  }

  // The state on the right.
  const meta = li.querySelector<HTMLElement>(".cap-row-meta");
  if (meta) {
    if (flag.state === "resolved") {
      const r = flag.resolution ?? "resolved";
      meta.replaceChildren(statusEl(r === "dismissed" ? "nodata" : "ok", WORDS[r]));
    } else meta.replaceChildren();
  }

  // The actions.
  const actions = li.querySelector<HTMLElement>(".cap-row-actions");
  if (actions) {
    actions.replaceChildren(
      ...(flag.state === "open"
        ? [
            actionButton("resolve", "Resolve", flag.message),
            actionButton("dismiss", "Dismiss", flag.message, "quiet"),
          ]
        : [actionButton("reopen", "Reopen", flag.message)]),
    );
  }

  // The quote's note and the suggestion's footer.
  const quoteNote = part(li, "anchor-note");
  if (quoteNote) {
    quoteNote.replaceChildren();
    if (status === "lost")
      quoteNote.append("The text this flag was raised on changed or was removed. Last known text:");
    quoteNote.hidden = quoteNote.childNodes.length === 0;
  }
  const sug = li.querySelector<HTMLElement>(".cap-flag-suggestion");
  if (sug && flag.suggestion) {
    const applied = flag.state === "resolved" && flag.resolution === "applied";
    sug.dataset.state = applied ? "applied" : "inert";
    const foot = part(sug, "suggestion-foot");
    if (foot) {
      foot.replaceChildren();
      if (applied || flag.state === "resolved") {
        // The flag's state says it: nothing to add under the suggestion.
      } else if (status !== "found")
        foot.append(
          el(
            "p",
            "cap-flag-note",
            "Cannot be applied: the passage it replaces has changed or gone.",
          ),
        );
      else if (ctx.owner) {
        const b = el("button", "cap-btn");
        b.type = "button";
        b.dataset.size = "sm";
        b.dataset.variant = "primary";
        b.dataset.capPart = "apply";
        b.append(
          "Apply",
          Object.assign(el("span", "cap-sr-only"), { textContent: ` suggestion: ${flag.message}` }),
        );
        foot.append(b);
      } else
        foot.append(
          el(
            "p",
            "cap-flag-note",
            `Only the owner${ctx.ownerName ? `, ${ctx.ownerName},` : ""} can apply this. The draft stays as it is until they do.`,
          ),
        );
    }
  }

  // Who closed it, and when.
  const body = li.querySelector<HTMLElement>(".cap-flag-body");
  body?.querySelector(".cap-flag-resolution")?.remove();
  if (body && flag.state === "resolved") {
    const p = el("p", "cap-flag-resolution");
    p.append(
      `${WORDS[flag.resolution ?? "resolved"]}${flag.resolvedBy ? ` by ${flag.resolvedBy}` : ""}`,
    );
    if (flag.resolvedAt) {
      const t = el("time", "cap-time");
      t.dataset.cap = "time";
      t.dateTime = flag.resolvedAt;
      t.textContent = timeText(parseTime(flag.resolvedAt), "relative");
      p.append(" ", t);
      enhanceTime(p);
    }
    p.append(".");
    body.append(p);
  }
}
