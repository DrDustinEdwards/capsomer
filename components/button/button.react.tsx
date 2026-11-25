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
  // In flight: the label stays (so width and name stay) under a spinner; clicks are ignored until it settles.
  pending?: boolean;
  // Said once to a screen reader when `pending` turns on, from an always-present polite live region.
  pendingLabel?: string;
  wrap?: boolean;
  block?: boolean;
  // The reason is written beside the button as its description; the button stays focusable.
  disabledReason?: ReactNode;
  iconOnly?: boolean;
  label?: string;
  // A label that changes in place eases the width and crossfades; wrap it in `.cap-btn-label`.
  morph?: boolean;
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

export function ButtonGroupText(props: { children?: ReactNode }) {
  return <span className="cap-btn-group-text">{props.children}</span>;
}
