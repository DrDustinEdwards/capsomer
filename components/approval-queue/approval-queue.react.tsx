import { useCleanId } from "../hooks/hooks.react.tsx";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "../confirm-dialog/confirm-dialog.react.tsx";
import { PlainForm, type FormComponent } from "../plain-form/plain-form.react.tsx";
import { Empty } from "../empty/empty.react.tsx";
import { isTypingKey, listOwnsKeys, moveRowFocus, singleKeysOff } from "../row-list/row-list.ts";
import { Status } from "../status/status.react.tsx";
import { Time } from "../time/time.react.tsx";
import {
  actionForKey,
  keyOf,
  nextAfter,
  summaryLine,
  type ApprovalAction,
  type ApprovalItem,
} from "./approval-queue.ts";

export type { ApprovalAction, ApprovalItem, FormComponent };

export interface ApprovalQueueProps {
  items: ApprovalItem[];
  // The queue's heading: "Waiting on you".
  label: string;
  // The heading is visible by default; a panel that already names the queue hides it.
  hideLabel?: boolean;
  // Where each item's form posts. Usually the route itself.
  action?: string;
  // The host router's form component (React Router's Form). Without it a plain <form>.
  Form?: FormComponent;
  // A decision is in flight: every decision button shows its spinner and ignores clicks.
  pending?: boolean;
  // The edit box's name for an item: "Post text for Example Co".
  textLabel?: (item: ApprovalItem) => string;
  // The findings list's name: "What the check held it for".
  findingsLabel?: string;
  // What an empty queue says.
  empty?: { title: ReactNode; text: ReactNode };
  // A fixed "now" for the times, for a test or a server's clock.
  now?: number;
}

const variantOf = (a: ApprovalAction) =>
  a.variant === "primary" || a.variant === "danger" ? a.variant : "default";

// Things your own side drafted, waiting for a person: each item's text (editable before the
// decision), what a check held it for, and its decisions as one form, so it all works with no
// script. With script: j and k move between items, a and r run an item's approve and reject, and a
// one-way decision asks first in the confirm dialog.
export function ApprovalQueue({
  items,
  label,
  hideLabel = false,
  action,
  Form = PlainForm,
  pending = false,
  textLabel = (i) => `Text for ${i.who}`,
  findingsLabel = "What the check held it for",
  empty = { title: "All clear", text: "Nothing is waiting." },
  now,
}: ApprovalQueueProps) {
  const uid = useCleanId();
  const rootRef = useRef<HTMLElement | null>(null);
  const [closed, setClosed] = useState<string[]>([]);
  const [asking, setAsking] = useState<{
    button: HTMLButtonElement;
    action: ApprovalAction;
    item: ApprovalItem;
  } | null>(null);
  // Where focus goes once a decided item has left: the next item's title, or the empty state.
  const focusNext = useRef<string | null | undefined>(undefined);
  const decided = useRef<string | null>(null);

  useEffect(() => {
    const want = focusNext.current;
    const root = rootRef.current;
    if (want === undefined || !root) return;
    const ids = items.map((i) => i.id);
    // The decided item is still here (the post failed, or is still on its way): focus stays.
    if (decided.current !== null && ids.includes(decided.current)) return;
    focusNext.current = undefined;
    decided.current = null;
    const target =
      (want &&
        root.querySelector<HTMLElement>(
          `.cap-mq-row[data-id='${CSS.escape(want)}'] .cap-row-title button`,
        )) ||
      root.querySelector<HTMLElement>(".cap-mq-row .cap-row-title button") ||
      root.querySelector<HTMLElement>(".cap-empty");
    target?.focus();
  }, [items]);

  const stateRef = useRef({ items });
  useLayoutEffect(() => {
    stateRef.current = { items };
  });

  // Sends an item's form with this button as its submitter, and remembers where focus goes next.
  const send = (button: HTMLButtonElement, item: ApprovalItem) => {
    const all = stateRef.current.items.map((i) => i.id);
    focusNext.current = nextAfter(all, item.id);
    decided.current = item.id;
    button.form?.requestSubmit(button);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      const list = root?.querySelector<HTMLElement>(".cap-mq-list");
      if (!root || !list || e.defaultPrevented || e.repeat || isTypingKey(e) || singleKeysOff())
        return;
      if (document.querySelector("dialog:modal")) return;
      // Focus in another queue on the page: that queue's keys, not these.
      const other = document.activeElement?.closest(".cap-mq-list");
      if (other && other !== list) return;
      if (e.key === "j" || e.key === "k") {
        if (!listOwnsKeys(list)) return;
        if (moveRowFocus(list, e.key === "j" ? 1 : -1) || list.contains(document.activeElement))
          e.preventDefault();
        return;
      }
      const row = document.activeElement?.closest<HTMLElement>(".cap-mq-row");
      if (!row || !list.contains(row)) return;
      const item = stateRef.current.items.find((i) => i.id === row.dataset.id);
      const act = item ? actionForKey(item, e.key) : null;
      if (!item || !act) return;
      const button = row.querySelector<HTMLButtonElement>(
        `button[name='intent'][value='${CSS.escape(act.intent)}']`,
      );
      if (!button || button.getAttribute("aria-disabled") === "true") return;
      e.preventDefault();
      if (act.confirm) setAsking({ button, action: act, item });
      else send(button, item);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const headingId = `${uid}-h`;
  return (
    <section
      className="cap-mq cap-approvals"
      data-cap="approval-queue"
      aria-labelledby={headingId}
      ref={rootRef}
    >
      <h2 className={hideLabel ? "cap-sr-only" : "cap-approvals-title"} id={headingId}>
        {label}
      </h2>
      <div className="cap-mq-head">
        <p className="cap-mq-summary" role="status">
          {summaryLine(items)}
        </p>
      </div>
      {items.length === 0 ? (
        <Empty kind="all-clear" title={empty.title} flush>
          {empty.text}
        </Empty>
      ) : (
        <ul
          className="cap-rows cap-mq-list"
          role="list"
          aria-labelledby={headingId}
          data-cap-primary=""
        >
          {items.map((item) => {
            const p = `${uid}-${item.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
            const open = !closed.includes(item.id);
            const formId = `${p}-form`;
            return (
              <li
                key={item.id}
                className="cap-row cap-mq-row"
                data-id={item.id}
                data-tone={item.status.tone === "crit" ? "crit" : undefined}
              >
                <span className="cap-row-status" id={`${p}-s`}>
                  <Status tone={item.status.tone}>{item.status.word}</Status>
                </span>
                <div className="cap-row-title">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`${p}-more`}
                    aria-describedby={`${p}-s${item.context ? ` ${p}-d` : ""}`}
                    onClick={() =>
                      setClosed((c) =>
                        c.includes(item.id) ? c.filter((x) => x !== item.id) : [...c, item.id],
                      )
                    }
                  >
                    {item.who}
                  </button>
                </div>
                {item.context ? (
                  <p className="cap-row-detail" id={`${p}-d`}>
                    {item.context}
                  </p>
                ) : null}
                <span className="cap-row-meta">
                  {item.at ? <Time at={item.at} now={now} /> : null}
                  <span className="cap-row-chevron" aria-hidden="true" />
                </span>
                <div className="cap-mq-more" id={`${p}-more`} hidden={!open}>
                  {item.findings?.length ? (
                    <ul className="cap-mq-findings" aria-label={findingsLabel}>
                      {item.findings.map((f) => (
                        <li key={f}>
                          <Status tone="warn">{f}</Status>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Form
                    method="post"
                    action={action}
                    id={formId}
                    className="cap-mq-edit"
                    aria-label={`Decide: ${item.who}`}
                    onClick={(e) => {
                      const b = (e.target as HTMLElement).closest<HTMLButtonElement>(
                        "button[name='intent']",
                      );
                      const act = item.actions.find((a) => a.intent === b?.value);
                      if (!b || !act?.confirm) return;
                      e.preventDefault();
                      setAsking({ button: b, action: act, item });
                    }}
                  >
                    <input type="hidden" name="id" value={item.id} />
                    {Object.entries(item.fields ?? {}).map(([name, value]) => (
                      <input key={name} type="hidden" name={name} value={value} />
                    ))}
                    {item.editable ? (
                      <>
                        <label className="cap-sr-only" htmlFor={`${p}-text`}>
                          {textLabel(item)}
                        </label>
                        <textarea
                          className="cap-input"
                          id={`${p}-text`}
                          name="text"
                          defaultValue={item.text}
                          rows={3}
                        />
                      </>
                    ) : (
                      <blockquote className="cap-mq-quote">{item.text}</blockquote>
                    )}
                    <div className="cap-mq-decide">
                      {item.actions.map((a) => {
                        const key = keyOf(a);
                        return (
                          <button
                            key={a.intent}
                            type="submit"
                            className="cap-btn"
                            data-variant={variantOf(a)}
                            data-size="sm"
                            name="intent"
                            value={a.intent}
                            aria-keyshortcuts={key}
                            aria-busy={pending || undefined}
                            aria-disabled={pending || undefined}
                            onClickCapture={(e) => {
                              if (pending) e.preventDefault();
                            }}
                          >
                            {a.label}
                            <span className="cap-sr-only"> for {item.who}</span>
                            {key ? (
                              <kbd className="cap-kbd" aria-hidden="true">
                                {key}
                              </kbd>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </Form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={asking !== null}
        title={asking?.action.confirm?.title ?? ""}
        lead={asking?.action.confirm?.lead}
        body={asking ? [asking.item.text] : []}
        action={asking?.action.confirm?.action ?? ""}
        returnTo={asking?.button}
        perform={async () => {
          if (asking) send(asking.button, asking.item);
        }}
        onClose={() => setAsking(null)}
      />
    </section>
  );
}
