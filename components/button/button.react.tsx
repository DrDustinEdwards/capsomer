import {
  useId,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { morphFrom } from "./button.ts";
import { buttonAttrs, type ButtonLook } from "./button-look.ts";

export { buttonAttrs, type ButtonLook };

export interface ButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "style">,
    Pick<ButtonLook, "variant" | "size"> {
  // In flight: the label stays (so the width and the name stay) and a spinner covers it.
  // Clicks are ignored until it settles.
  pending?: boolean;
  // Said once to a screen reader when `pending` turns on ("Connecting to Stripe"), from a polite
  // live region beside the button that is always in the page, so the change is heard.
  pendingLabel?: string;
  // A long label wraps onto more lines (a narrow column, a phone).
  wrap?: boolean;
  // Fills its row.
  block?: boolean;
  // Disabled, with the reason written beside the button. The button stays focusable and
  // the reason is its description; clicks are ignored.
  disabledReason?: ReactNode;
  // An icon button: `children` is the icon and `label` its accessible name.
  iconOnly?: boolean;
  label?: string;
  // A label that changes in place (Save, Saving…, Saved) eases the width and crossfades the
  // words. The label is wrapped in `.cap-btn-label`.
  morph?: boolean;
  // The button element, for an app that moves focus to it (React 19 passes it through).
  ref?: Ref<HTMLButtonElement>;
  children?: ReactNode;
}

export function Button(props: ButtonProps) {
  const {
    variant = "default",
    size = "default",
    pending = false,
    pendingLabel,
    wrap = false,
    block = false,
    disabledReason,
    iconOnly = false,
    label,
    morph = false,
    children,
    type = "button",
    onClick,
    className,
    ...rest
  } = props;
  const reasonId = useId();
  const disabled = disabledReason != null && disabledReason !== false;
  const describedBy =
    [rest["aria-describedby"], disabled ? reasonId : null].filter(Boolean).join(" ") || undefined;

  // The morph: after React writes a new label, animate from the last width and a copy of the
  // last label (button.ts).
  const labelRef = useRef<HTMLSpanElement>(null);
  const last = useRef<{ text: string; width: number; copy: HTMLElement } | null>(null);
  useLayoutEffect(() => {
    const el = labelRef.current;
    const button = el?.parentElement;
    if (!morph || !el || !button) return;
    const prev = last.current;
    const text = el.textContent ?? "";
    const width =
      prev && prev.text !== text ? morphFrom(button, prev.width, prev.copy) : button.offsetWidth;
    last.current = { text, width, copy: el.cloneNode(true) as HTMLElement };
  });

  const click = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || pending) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const button = (
    <button
      {...rest}
      type={type}
      {...buttonAttrs(
        { variant, size, iconOnly, wrap, block, label, "aria-label": rest["aria-label"] },
        className,
      )}
      aria-disabled={disabled ? true : undefined}
      aria-describedby={describedBy}
      aria-busy={pending ? true : undefined}
      onClick={click}
    >
      {pending ? <span className="cap-btn-spinner" aria-hidden="true" /> : null}
      {pending || morph ? (
        <span className="cap-btn-label" ref={labelRef}>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );

  const live =
    pendingLabel === undefined ? null : (
      <span className="cap-sr-only" role="status">
        {pending ? pendingLabel : ""}
      </span>
    );
  if (!disabled && !live) return button;
  return (
    <>
      {button}
      {live}
      {disabled ? (
        <span className="cap-btn-reason" id={reasonId}>
          {disabledReason}
        </span>
      ) : null}
    </>
  );
}

// Buttons sharing one edge. `orientation` is horizontal unless set.
export function ButtonGroup(props: {
  label?: string;
  orientation?: "horizontal" | "vertical";
  children?: ReactNode;
  className?: string;
}) {
  const { label, orientation = "horizontal", children, className } = props;
  return (
    <div
      role="group"
      aria-label={label}
      className={className ? `cap-btn-group ${className}` : "cap-btn-group"}
      data-orientation={orientation === "vertical" ? "vertical" : undefined}
    >
      {children}
    </div>
  );
}

// Static text that sits in a group beside the buttons.
export function ButtonGroupText(props: { children?: ReactNode }) {
  return <span className="cap-btn-group-text">{props.children}</span>;
}
