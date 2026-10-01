import { useId, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "style"> {
  variant?: "default" | "primary" | "danger" | "quiet";
  // In flight: the label stays (so the width and the name stay) and a spinner covers it.
  // Clicks are ignored until it settles.
  pending?: boolean;
  // Disabled, with the reason written beside the button. The button stays focusable and
  // the reason is its description; clicks are ignored.
  disabledReason?: ReactNode;
  // An icon button: `children` is the icon and `label` its accessible name.
  iconOnly?: boolean;
  label?: string;
  children?: ReactNode;
}

export function Button(props: ButtonProps) {
  const { variant = "default", pending = false, disabledReason, iconOnly = false, label, children, type = "button", onClick, className, ...rest } = props;
  const reasonId = useId();
  const disabled = disabledReason != null && disabledReason !== false;
  const describedBy = [rest["aria-describedby"], disabled ? reasonId : null].filter(Boolean).join(" ") || undefined;
  if (iconOnly && !label && !rest["aria-label"]) console.warn("Button: an icon-only button needs a label.");

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
      className={className ? `cap-btn ${className}` : "cap-btn"}
      data-variant={variant === "default" ? undefined : variant}
      data-icon-only={iconOnly ? "" : undefined}
      aria-label={iconOnly ? (label ?? rest["aria-label"]) : rest["aria-label"]}
      aria-disabled={disabled ? true : undefined}
      aria-describedby={describedBy}
      aria-busy={pending ? true : undefined}
      onClick={click}
    >
      {pending ? <span className="cap-btn-spinner" aria-hidden="true" /> : null}
      {pending ? <span className="cap-btn-label">{children}</span> : children}
    </button>
  );

  if (!disabled) return button;
  return (
    <>
      {button}
      <span className="cap-btn-reason" id={reasonId}>
        {disabledReason}
      </span>
    </>
  );
}
