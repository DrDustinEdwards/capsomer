import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { isImeEnter } from "../shortcuts/shortcuts.ts";
import { attachRowList } from "./row-list.ts";

export interface RowListProps {
  // The list's name: the heading id that names it (preferred), or a label.
  labelledBy?: string;
  label?: string;
  // The page's main list: j and k work on it even before focus is inside it. One per page.
  primary?: boolean;
  // shadcn's ItemGroup gap: separate the rows (use with variant "outline" or "muted" on the rows).
  gap?: "sm" | "xs" | "default";
  children: ReactNode;
}

export function RowList({ labelledBy, label, primary = false, gap, children }: RowListProps) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => (ref.current ? attachRowList(ref.current) : undefined), []);
  return (
    // role="list" keeps list semantics in Safari, which drops them from a list-style: none list.
    <ul
      ref={ref}
      className="cap-rows"
      data-cap="row-list"
      role="list"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      data-cap-primary={primary ? "" : undefined}
      data-gap={gap === undefined ? undefined : gap === "default" ? "" : gap}
    >
      {children}
    </ul>
  );
}

export interface RowLinkProps {
  href: string;
  "aria-describedby"?: string;
  children: ReactNode;
}

export interface RowProps {
  title: ReactNode;
  // The row opens its detail by following href (a link), or by calling onOpen (a button)
  // when the detail opens in place, such as a side panel. With neither, the row is read, not
  // opened (a checklist step, a fact): its title is plain text, and only its actions are controls.
  href?: string;
  onOpen?: () => void;
  // A status (.cap-status: glyph, word and color), shown first.
  status?: ReactNode;
  detail?: ReactNode;
  // The time or other trailing fact, usually a .cap-time.
  meta?: ReactNode;
  // Real buttons, raised above the stretched link.
  actions?: ReactNode;
  tone?: "crit";
  // shadcn's Item variants and sizes: "outline" draws the row's edge, "muted" tints it.
  variant?: "outline" | "muted";
  size?: "sm" | "xs";
  // shadcn's ItemMedia, shown in the first column instead of a status: an icon or a picture.
  media?: ReactNode;
  mediaVariant?: "icon" | "image";
  // A row that opens in place (a group of like rows): its button reports aria-expanded and
  // names what it controls, and a chevron after the time turns when it is open.
  expanded?: boolean;
  controls?: string;
  // A class a composing component adds to the row (the attention list's cap-attention-child).
  className?: string;
  // A router's link component; a plain <a> by default.
  renderLink?: (props: RowLinkProps) => ReactNode;
  // A reply opened in the row (an answer to a question, a note that unblocks a job): a RowReply,
  // shown under the row's text across the row, above the stretched link.
  reply?: ReactNode;
}

const plainLink = ({ children, ...props }: RowLinkProps) => <a {...props}>{children}</a>;

export function Row({
  title,
  href,
  onOpen,
  status,
  detail,
  meta,
  actions,
  tone,
  variant,
  size,
  media,
  mediaVariant,
  expanded,
  controls,
  className,
  renderLink = plainLink,
  reply,
}: RowProps) {
  const id = useId();
  // The link's name is the title; the status and the detail are its description, so a
  // screen reader moving by link still hears "Critical" and why.
  const described =
    [status != null ? `${id}-status` : "", detail != null ? `${id}-detail` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <li
      className={className ? `cap-row ${className}` : "cap-row"}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
      data-static={href == null && onOpen == null && expanded === undefined ? "" : undefined}
    >
      {media != null && (
        <span className="cap-row-media" data-variant={mediaVariant}>
          {media}
        </span>
      )}
      {status != null && (
        <span className="cap-row-status" id={`${id}-status`}>
          {status}
        </span>
      )}
      <div className="cap-row-title">
        {href != null ? (
          renderLink({ href, "aria-describedby": described, children: title })
        ) : onOpen == null && expanded === undefined ? (
          <span className="cap-row-text">{title}</span>
        ) : (
          <button
            type="button"
            aria-describedby={described}
            aria-expanded={expanded}
            aria-controls={expanded === undefined ? undefined : controls}
            onClick={onOpen}
          >
            {title}
          </button>
        )}
      </div>
      {detail != null && (
        <p className="cap-row-detail" id={`${id}-detail`}>
          {detail}
        </p>
      )}
      {(meta != null || expanded !== undefined) && (
        <span className="cap-row-meta">
          {meta}
          {expanded !== undefined ? <span className="cap-row-chevron" aria-hidden="true" /> : null}
        </span>
      )}
      {actions != null && <div className="cap-row-actions">{actions}</div>}
      {reply != null && <div className="cap-row-reply">{reply}</div>}
    </li>
  );
}

export interface RowReplyProps {
  // What the words are for, as the box's label: "Your answer, sent to its driver".
  label: string;
  // Sends the words; return a string to show why they were not sent ("Write what you did first").
  onSend: (text: string) => string | void | Promise<string | void>;
  onCancel: () => void;
  sendLabel?: string;
  // Shown when Send is pressed with nothing written.
  emptyHint?: string;
  defaultValue?: string;
  rows?: number;
}

// A reply inside a row: a labelled box that takes focus when it opens, Send and Cancel, a hint
// that is announced when the words cannot be sent, Ctrl or Cmd+Enter to send and Esc to cancel.
export function RowReply({
  label,
  onSend,
  onCancel,
  sendLabel = "Send",
  emptyHint = "Write something first.",
  defaultValue = "",
  rows = 3,
}: RowReplyProps) {
  const id = useId();
  const [text, setText] = useState(defaultValue);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => box.current?.focus(), []);
  const send = async () => {
    if (busy) return;
    if (!text.trim()) {
      setHint(emptyHint);
      return;
    }
    setBusy(true);
    try {
      const refused = await onSend(text.trim());
      if (typeof refused === "string") setHint(refused);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="cap-row-reply-form"
      aria-busy={busy || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <label className="cap-field-label" htmlFor={`${id}-text`}>
        {label}
      </label>
      <textarea
        ref={box}
        className="cap-input"
        id={`${id}-text`}
        rows={rows}
        value={text}
        aria-invalid={hint ? true : undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => {
          setText(e.target.value);
          setHint(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isImeEnter(e.nativeEvent)) {
            e.preventDefault();
            void send();
          }
        }}
      />
      {hint && (
        <p className="cap-field-error" id={`${id}-hint`} role="alert">
          {hint}
        </p>
      )}
      <div className="cap-row-reply-actions">
        <button type="submit" className="cap-btn" data-variant="primary" disabled={busy}>
          {sendLabel}
        </button>
        <button type="button" className="cap-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// What a row action needs from the app's router: a form that posts without leaving the page,
// and whether its post is under way (the row hides itself until the server answers). Each row
// calls the hook once, so each row has its own (React Router: useRouterRowForm in
// capsomer/react/router).
export interface RowForm {
  Form: ComponentType<
    Omit<FormHTMLAttributes<HTMLFormElement>, "method"> & {
      method?: "post" | "get";
      children?: ReactNode;
    }
  >;
  pending: boolean;
}

function PlainForm({ method = "post", ...props }: ComponentProps<"form">) {
  return <form method={method} {...props} />;
}

// The default: a plain form that posts and loads the page the server answers with.
export function usePlainRowForm(): RowForm {
  return { Form: PlainForm as RowForm["Form"], pending: false };
}
