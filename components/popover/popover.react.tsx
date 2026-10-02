import { createContext, useContext, useEffect, useId, useRef, type ComponentProps, type ReactNode } from "react";
import { enhance, type Align, type Side } from "./popover.ts";

// Renders the HTML contract in popover.md: the content is in the markup, hidden by the
// popover attribute, so it server-renders. Open or closed is the platform's popover state
// (the behaviour module shows, hides, places and returns focus), not React state.
type Kind = "dialog" | "tooltip";
const Ctx = createContext<{ id: string; kind: Kind }>({ id: "", kind: "dialog" });

export interface PopoverProps {
  // "dialog" (default): a click popover. "tooltip": detail on hover and keyboard focus.
  kind?: Kind;
  children: ReactNode;
}

export function Popover({ kind = "dialog", children }: PopoverProps) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => (ref.current ? enhance(ref.current) : undefined), []);
  return (
    <Ctx.Provider value={{ id, kind }}>
      <span data-cap="popover" ref={ref}>
        {children}
      </span>
    </Ctx.Provider>
  );
}

export function PopoverTrigger({ className = "cap-btn", type = "button", ...props }: ComponentProps<"button">) {
  const { id, kind } = useContext(Ctx);
  return kind === "tooltip" ? (
    <button type={type} className={className} aria-describedby={id} data-popover-trigger="" {...props} />
  ) : (
    <button type={type} className={className} popoverTarget={id} aria-haspopup="dialog" aria-expanded="false" {...props} />
  );
}

export interface PopoverContentProps extends Omit<ComponentProps<"div">, "popover"> {
  side?: Side;
  align?: Align;
  // Gap from the trigger in px. Default 4.
  offset?: number;
  size?: "sm" | "md" | "lg" | "auto";
  // Draws the arrow pointing at the trigger.
  arrow?: boolean;
}

export function PopoverContent({ side, align, offset, size, arrow, className, children, ...props }: PopoverContentProps) {
  const { id, kind } = useContext(Ctx);
  const tip = kind === "tooltip";
  return (
    <div
      className={className ? `cap-popover ${className}` : "cap-popover"}
      id={id}
      popover={tip ? "manual" : "auto"}
      role={tip ? "tooltip" : "dialog"}
      aria-labelledby={tip || props["aria-label"] ? undefined : `${id}-title`}
      data-variant={tip ? "tooltip" : undefined}
      data-side={side}
      data-align={align}
      data-offset={offset}
      data-size={size}
      {...props}
    >
      {children}
      {arrow ? <span className="cap-popover-arrow" aria-hidden="true" /> : null}
    </div>
  );
}

export function PopoverHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={className ? `cap-popover-header ${className}` : "cap-popover-header"} {...props} />;
}

// Names the dialog: PopoverContent points aria-labelledby at it.
export function PopoverTitle({ className, ...props }: ComponentProps<"h2">) {
  const { id } = useContext(Ctx);
  return <h2 className={className ? `cap-popover-title ${className}` : "cap-popover-title"} id={`${id}-title`} {...props} />;
}

export function PopoverDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={className ? `cap-popover-description ${className}` : "cap-popover-description"} {...props} />;
}
