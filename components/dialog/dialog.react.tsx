import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { closeDialog, openDialog, setDialogBusy, wireDialog } from "./dialog.ts";

export type DialogPlacement = "center" | "right" | "left" | "bottom" | "top";
export type DialogSize = "sm" | "md" | "lg";

interface Ids {
  title: string;
  description: string;
  setDescribed: (on: boolean) => void;
}
const Ctx = createContext<Ids | null>(null);

export interface DialogProps extends Omit<HTMLAttributes<HTMLDialogElement>, "style" | "onClose" | "role"> {
  // Controlled: true opens it (showModal), false closes it.
  open: boolean;
  // Called once per close, by Esc, Close, Cancel, the backdrop or Back, with false.
  onOpenChange: (open: boolean) => void;
  placement?: DialogPlacement;
  size?: DialogSize;
  // A question the person must answer: role="alertdialog", focus on Cancel, and a click
  // outside does nothing. No Close button unless closeButton says so.
  alert?: boolean;
  // A click on the backdrop does nothing (Esc still closes).
  modalLock?: boolean;
  // Focus goes to Cancel on open, as for an alert, without the alert role.
  destructive?: boolean;
  // Busy: aria-busy, and Esc, Close, Cancel and the backdrop refuse.
  busy?: boolean;
  // Push "#dialog-<historyId>" so Back closes it.
  history?: boolean;
  historyId?: string;
  // The corner Close button. Default: shown, except for an alert.
  closeButton?: boolean;
  closeLabel?: string;
  // Where focus goes when the opener has gone; the page's main region by default.
  returnTo?: HTMLElement | null;
  // Where focus goes on open. Default: the [autofocus] control, else the first one.
  initialFocus?: { current: HTMLElement | null };
  // Server-rendered markup cannot know a DialogDescription is inside; say so here to have
  // aria-describedby in the HTML.
  described?: boolean;
  ref?: Ref<HTMLDialogElement>;
  // Names the dialog when there is no DialogTitle. With a DialogTitle, leave it out.
  "aria-label"?: string;
  children?: ReactNode;
}

const CLOSE_ICON = <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />;

export function Dialog(props: DialogProps) {
  const {
    open,
    onOpenChange,
    placement = "center",
    size = "md",
    alert = false,
    modalLock,
    destructive,
    busy,
    history = false,
    historyId,
    closeButton = !alert,
    closeLabel = "Close",
    returnTo,
    initialFocus,
    described = false,
    ref,
    className,
    children,
    ...rest
  } = props;
  const id = useId();
  const own = useRef<HTMLDialogElement | null>(null);
  const [hasDescription, setDescribed] = useState(described);
  const labelled = rest["aria-label"] == null && rest["aria-labelledby"] == null;
  const setRefs = useCallback(
    (el: HTMLDialogElement | null) => {
      own.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  // Wired once the markup is on the page; the markup itself is complete without it.
  useEffect(() => {
    const d = own.current;
    return d ? wireDialog(d) : undefined;
  }, []);

  useEffect(() => {
    const d = own.current;
    if (!d) return;
    if (open && !d.open) openDialog(d, document.activeElement, { history, returnTo, focus: initialFocus?.current ?? null });
    else if (!open && d.open) closeDialog(d);
  }, [open, history, returnTo, initialFocus]);

  // Close and Cancel say they are refusing while busy.
  useEffect(() => {
    if (own.current) setDialogBusy(own.current, !!busy);
  }, [busy]);

  return (
    <Ctx.Provider value={{ title: `${id}-title`, description: `${id}-description`, setDescribed }}>
      <dialog
        {...rest}
        ref={setRefs}
        className={className ? `cap-dialog ${className}` : "cap-dialog"}
        data-cap="dialog"
        data-placement={placement}
        data-size={size}
        data-cap-modal-lock={modalLock ? "" : undefined}
        data-cap-destructive={destructive ? "" : undefined}
        data-cap-history={history ? "" : undefined}
        data-cap-history-id={history ? historyId : undefined}
        role={alert ? "alertdialog" : undefined}
        aria-labelledby={rest["aria-labelledby"] ?? (labelled ? `${id}-title` : undefined)}
        aria-describedby={rest["aria-describedby"] ?? (hasDescription ? `${id}-description` : undefined)}
        aria-busy={busy || undefined}
        onClose={() => onOpenChange(false)}
      >
        {children}
        {closeButton && <DialogClose label={closeLabel} />}
      </dialog>
    </Ctx.Provider>
  );
}

export function DialogHeader({ className, divider, ...rest }: HTMLAttributes<HTMLDivElement> & { divider?: boolean }) {
  return <div {...rest} className={className ? `cap-dialog-header ${className}` : "cap-dialog-header"} data-divider={divider ? "" : undefined} />;
}

export function DialogTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  const ids = useContext(Ctx);
  return <h2 id={ids?.title} {...rest} className={className ? `cap-dialog-title ${className}` : "cap-dialog-title"} />;
}

export function DialogDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  const ids = useContext(Ctx);
  const set = ids?.setDescribed;
  useEffect(() => {
    set?.(true);
    return () => set?.(false);
  }, [set]);
  return <p id={ids?.description} {...rest} className={className ? `cap-dialog-description ${className}` : "cap-dialog-description"} />;
}

// An icon tile beside the title, as Alert Dialog's media.
export function DialogMedia({ className, tone, ...rest }: HTMLAttributes<HTMLDivElement> & { tone?: "crit" | "warn" }) {
  return <div aria-hidden="true" {...rest} className={className ? `cap-dialog-media ${className}` : "cap-dialog-media"} data-tone={tone} />;
}

// The part that scrolls when the content is taller than the screen.
export function DialogBody({ className, flush, ...rest }: HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  return <div {...rest} className={className ? `cap-dialog-body ${className}` : "cap-dialog-body"} data-flush={flush ? "" : undefined} />;
}

export function DialogFooter({ className, align, ...rest }: HTMLAttributes<HTMLDivElement> & { align?: "start" | "between" }) {
  return <div {...rest} className={className ? `cap-dialog-footer ${className}` : "cap-dialog-footer"} data-align={align} />;
}

// A Close part. With no children it is the corner icon button; with children it is a button
// that closes (a Cancel in the footer: `<DialogClose part="cancel">Cancel</DialogClose>`).
export function DialogClose({ label = "Close", part = "close", children, className, onClick, ...rest }: Omit<HTMLAttributes<HTMLButtonElement>, "children"> & { label?: string; part?: "close" | "cancel"; children?: ReactNode }) {
  if (children != null) {
    return (
      <button type="button" {...rest} className={className ? `cap-btn ${className}` : "cap-btn"} data-cap-part={part} onClick={onClick}>
        {children}
      </button>
    );
  }
  return (
    <button type="button" {...rest} className={`cap-btn cap-dialog-close${className ? ` ${className}` : ""}`} data-variant="quiet" data-icon-only="" data-cap-part={part} aria-label={label} onClick={onClick}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        {CLOSE_ICON}
      </svg>
    </button>
  );
}

// The state a trigger and a Dialog share: `const d = useDialog(); <button onClick={d.show}>`
// and `<Dialog {...d.props}>`. Focus goes back to the button that was focused when show ran.
export function useDialog(initial = false): { open: boolean; show: () => void; hide: () => void; toggle: () => void; props: { open: boolean; onOpenChange: (open: boolean) => void } } {
  const [open, setOpen] = useState(initial);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  return { open, show, hide, toggle, props: { open, onOpenChange: setOpen } };
}
