import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Switch } from "../switch/switch.react.tsx";
import { KINDS, KIND_LABEL, STORAGE_KEY, summarise, type Kind, type RunInput, type Summary } from "./authorship.ts";

export type { Kind };

export interface RunProps {
  kind: Kind;
  // A block (a div around paragraphs) rather than a span inside one.
  block?: boolean;
  // Something small before the word on the label: an Avatar with aria-hidden, for example.
  badge?: ReactNode;
  children?: ReactNode;
}

// One passage and who wrote it: the rule in the margin and the label ("You", "AI", "Quoted").
export function Run({ kind, block = false, badge, children }: RunProps) {
  const label = (
    <span className="cap-run-label">
      {badge}
      {KIND_LABEL[kind]}
    </span>
  );
  return block ? (
    <div className="cap-run" data-kind={kind}>
      {label}
      {children}
    </div>
  ) : (
    <span className="cap-run" data-kind={kind}>
      {label}
      {children}
    </span>
  );
}

// The words under each Run, found by walking the children (text nested in elements counts).
function collect(node: ReactNode, kind: Kind | null, out: RunInput[]): void {
  Children.forEach(node, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      if (kind) out.push({ kind, text: String(child) });
    } else if (isValidElement(child)) {
      const el = child as ReactElement<{ kind?: Kind; children?: ReactNode }>;
      collect(el.props.children, el.type === Run && el.props.kind ? el.props.kind : kind, out);
    }
  });
}

function Meter({ summary }: { summary: Summary }) {
  const bar = useRef<HTMLSpanElement>(null);
  // Widths go through the CSSOM, never a style prop (style-src 'self').
  useLayoutEffect(() => {
    for (const seg of bar.current?.querySelectorAll<HTMLElement>(".cap-authorship-seg") ?? []) {
      const share = summary.shares.find((s) => s.kind === seg.dataset.kind);
      seg.style.setProperty("--cap-share", String(share?.percent ?? 0));
    }
  }, [summary]);
  return (
    <div className="cap-meter cap-authorship-summary" data-cap-part="summary">
      <span className="cap-meter-label">Authorship</span>
      <span className="cap-meter-value" data-cap-part="text">
        {summary.text}
      </span>
      <span className="cap-meter-bar" aria-hidden="true" ref={bar}>
        {summary.shares.map((s) => (
          <span key={s.kind} className="cap-authorship-seg" data-kind={s.kind} data-share={s.percent} />
        ))}
      </span>
      <span className="cap-meter-note" data-cap-part="notes">
        {summary.shares
          .filter((s) => s.words > 0)
          .map((s) => (
            <span key={s.kind}>
              {KIND_LABEL[s.kind]}: {s.words.toLocaleString("en")} {s.words === 1 ? "word" : "words"}
            </span>
          ))}
      </span>
    </div>
  );
}

export interface AuthorshipProps {
  // Controlled; leave both out and the component remembers the person's choice.
  shown?: boolean;
  onShownChange?: (shown: boolean) => void;
  // Shown unless the person chose otherwise. Default true.
  defaultShown?: boolean;
  // Keep the choice in localStorage (the uncontrolled default).
  remember?: boolean;
  // The runs, as <Run>s inside your paragraphs.
  children: ReactNode;
}

// The switch, the summary and the marked text. The summary counts the words under each Run.
export function Authorship({ shown, onShownChange, defaultShown = true, remember = true, children }: AuthorshipProps) {
  const [own, setOwn] = useState(defaultShown);
  const on = shown ?? own;
  const keep = remember && shown === undefined;
  // The remembered choice is read after mount, so a server render and the first client render agree.
  useEffect(() => {
    if (!keep) return;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "on" || v === "off") setOwn(v === "on");
    } catch {
      // Storage blocked: the default stands.
    }
  }, [keep]);
  const runs: RunInput[] = [];
  collect(children, null, runs);
  const summary = summarise(runs.filter((r) => KINDS.includes(r.kind)));
  return (
    <div className="cap-authorship" data-authorship={on ? "on" : "off"}>
      <div className="cap-authorship-bar">
        <Switch
          label="Show authorship"
          checked={on}
          onCheckedChange={(next) => {
            setOwn(next);
            onShownChange?.(next);
            if (keep) {
              try {
                localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
              } catch {
                // Not remembered; the choice still applies now.
              }
            }
          }}
        />
        <Meter summary={summary} />
      </div>
      <div className="cap-authorship-text">{children}</div>
    </div>
  );
}
