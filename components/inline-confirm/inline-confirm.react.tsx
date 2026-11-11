import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";

const noSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

export type FormComponent = ComponentType<FormHTMLAttributes<HTMLFormElement>>;

export interface InlineConfirmProps {
  // The first button's words ("Remove member"). Name the thing when the row does not.
  label: ReactNode;
  // Words only a screen reader hears after the label, naming what it acts on (" Alex Rivera").
  labelDetail?: string;
  // The question in place of the button ("Remove Alex Rivera?").
  question: ReactNode;
  // The second step's button ("Yes, remove member"): the action itself.
  confirmLabel: ReactNode;
  cancelLabel?: ReactNode;
  // With no script the first step is a link to this address (the page with the question open,
  // "?confirm=<id>"), and Cancel a link to `closeHref`.
  openHref: string;
  closeHref: string;
  // Open from the start: the page was asked for at openHref.
  defaultOpen?: boolean;
  // The action is running: the confirm says pendingLabel and Cancel is withdrawn.
  pending?: boolean;
  pendingLabel?: ReactNode;
  // danger (default) for an action that loses something; default for one that does not.
  tone?: "danger" | "default";
  size?: "sm" | "default";
  // The form element (React Router's Form, or a read-only guard); default a plain <form>.
  form?: FormComponent | "form";
  method?: "post" | "get";
  action?: string;
  // The hidden inputs that name the action ("_action", "memberId").
  children?: ReactNode;
}

// A two-step action in place, for a row's one risky button: the button gives way to the
// question with the confirm and Cancel beside it. It works with no script (the first step is
// a link to the page with the question open), and with script opens in place. Focus follows
// the swap: opening lands on Cancel, never on the confirm, so a second Enter cannot act;
// Cancel returns to the first button.
export function InlineConfirm({
  label,
  labelDetail,
  question,
  confirmLabel,
  cancelLabel = "Cancel",
  openHref,
  closeHref,
  defaultOpen = false,
  pending = false,
  pendingLabel,
  tone = "danger",
  size = "sm",
  form = "form",
  method = "post",
  action,
  children,
}: InlineConfirmProps) {
  const ready = useMounted();
  const [open, setOpen] = useState(defaultOpen);
  // Opened by the page's address: Cancel takes focus when it first shows.
  const [byAddress] = useState(defaultOpen);
  const moved = useRef(false);
  const opener = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const qid = useId();
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    (open ? cancel.current : opener.current)?.focus();
  }, [open]);
  const swap = (to: boolean) => {
    moved.current = true;
    setOpen(to);
  };
  const btn = { className: "cap-btn", "data-size": size === "sm" ? "sm" : undefined };
  const words = (
    <>
      {label}
      {labelDetail ? <span className="cap-sr-only">{labelDetail}</span> : null}
    </>
  );

  if (!open)
    return ready ? (
      <button type="button" {...btn} data-variant="quiet" ref={opener} onClick={() => swap(true)}>
        {words}
      </button>
    ) : (
      <a href={openHref} {...btn} data-variant="quiet">
        {words}
      </a>
    );

  const Form = form as FormComponent;
  return (
    <Form method={method} action={action} className="cap-inline-confirm" aria-labelledby={qid}>
      {children}
      <span className="cap-inline-confirm-question" id={qid}>
        {question}
      </span>
      <span className="cap-inline-confirm-actions">
        <button
          type="submit"
          {...btn}
          data-variant={tone === "danger" ? "danger" : "primary"}
          aria-describedby={qid}
          aria-busy={pending || undefined}
          aria-disabled={pending || undefined}
          onClick={(e) => {
            if (pending) e.preventDefault();
          }}
        >
          {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
        </button>
        {pending ? null : ready ? (
          <button
            type="button"
            {...btn}
            data-variant="quiet"
            ref={cancel}
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- a confirm opened by the page's address lands on Cancel, so Enter cannot act
            autoFocus={byAddress}
            onClick={() => swap(false)}
          >
            {cancelLabel}
          </button>
        ) : (
          <a href={closeHref} {...btn} data-variant="quiet">
            {cancelLabel}
          </a>
        )}
      </span>
    </Form>
  );
}
