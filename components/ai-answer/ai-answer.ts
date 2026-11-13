// An AI answer: a labeled region that says it is AI generated and may be wrong, a status while
// it is looked up, the answer as it streams in, a note when it was cut off, its sources and a
// follow-up question. No framework, and no fetching: the app reads its own stream and hands the
// text to the panel. Every write goes through textContent, so generated text is never HTML.
import { uid } from "../hooks/hooks.ts";

export interface AnswerSource {
  // A same-origin path ("/notes/field-notes"); anything else did not come from the site and is
  // dropped rather than shown unlinked.
  href: string;
  title: string;
  // A short word after the title, such as "section".
  kind?: string;
}

export interface AnswerWords {
  // The region's name. "AI answer" by default.
  label?: string;
  badge?: string;
  note?: string;
  // The status while nothing has arrived.
  looking?: string;
  cut?: string;
  sources?: string;
}

export const ANSWER_WORDS: Required<AnswerWords> = {
  label: "AI answer",
  badge: "AI generated",
  note: "May be wrong. Check the sources.",
  // Not "Thinking...": an answer is a lookup, and an ellipsis reads as stalling.
  looking: "Looking it up.",
  cut: "This answer was cut off before it finished. The sources below say more.",
  sources: "Sources",
};

export interface AnswerPanel {
  // The region, focusable (tabindex -1) but not a Tab stop, so focus has somewhere to go when the
  // control that asked hides.
  el: HTMLElement;
  // The answer so far, the whole text each time (not a delta).
  write: (text: string) => void;
  setSources: (sources: AnswerSource[]) => void;
  // A next question, as a link. Rebuilt only when its words change.
  setFollowUp: (text: string, href: string) => void;
  // The model stopped before it finished.
  markCut: () => void;
  // Nothing came, or the stream broke: the status says so, and so does the announcer.
  fail: (message: string) => void;
  // The stream ended: the whole answer is announced once.
  finish: () => void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function isSitePath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

// Builds the panel. Put `el` in the page, then write to it as the answer arrives.
export function buildAnswer(words: AnswerWords = {}): AnswerPanel {
  const w = { ...ANSWER_WORDS, ...words };
  const panel = el("section", "cap-ai-answer");
  panel.dataset.cap = "ai-answer";
  panel.setAttribute("aria-label", w.label);
  panel.tabIndex = -1;

  const head = el("div", "cap-ai-answer-head");
  const badge = el("span", "cap-badge", w.badge);
  badge.dataset.variant = "default";
  head.append(badge, el("span", "cap-ai-answer-note", w.note));

  const status = el("p", "cap-ai-answer-status", w.looking);
  const body = el("p", "cap-ai-answer-body");
  body.setAttribute("aria-busy", "true");
  const cut = el("p", "cap-ai-answer-cut", w.cut);
  cut.hidden = true;

  const sources = el("div", "cap-ai-answer-sources");
  sources.hidden = true;
  const followUp = el("p", "cap-ai-answer-followup");
  followUp.hidden = true;

  // The body is not live: rewritten on every token, it would be read over and over. This region
  // speaks twice: that the lookup started, then the whole answer or the failure.
  const announcer = el("p", "cap-sr-only");
  announcer.setAttribute("aria-live", "polite");

  panel.append(head, status, body, cut, sources, followUp, announcer);
  // A frame later, so the live region is in the tree before its text changes and it is heard.
  requestAnimationFrame(() => {
    if (!announcer.textContent) announcer.textContent = w.looking;
  });

  let text = "";
  return {
    el: panel,
    write(next) {
      text = next;
      if (next) status.hidden = true;
      body.textContent = next;
    },
    setSources(list) {
      const shown = list.filter((s) => isSitePath(s.href));
      sources.replaceChildren();
      sources.hidden = shown.length === 0;
      if (!shown.length) return;
      const heading = el("p", "cap-ai-answer-sources-label", w.sources);
      heading.id = uid("cap-ai-sources");
      const ol = el("ol");
      ol.setAttribute("aria-labelledby", heading.id);
      for (const s of shown) {
        const li = el("li");
        const a = el("a", undefined, s.title);
        a.href = s.href;
        li.append(a);
        if (s.kind) li.append(el("span", "cap-ai-answer-kind", ` ${s.kind}`));
        ol.append(li);
      }
      sources.append(heading, ol);
    },
    setFollowUp(words, href) {
      if (!words || followUp.textContent === words) return;
      const a = el("a", undefined, words);
      a.href = href;
      followUp.replaceChildren(a);
      followUp.hidden = false;
    },
    markCut() {
      cut.hidden = false;
    },
    fail(message) {
      status.textContent = message;
      status.hidden = false;
      body.removeAttribute("aria-busy");
      announcer.textContent = message;
    },
    finish() {
      body.removeAttribute("aria-busy");
      announcer.textContent = `${w.label}: ${text}${cut.hidden ? "" : ` ${w.cut}`}`;
    },
  };
}
