import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { attach } from "./tooltip.ts";

export interface TriggerProps {
  ref: (el: HTMLElement | null) => void;
  "aria-describedby": string;
}

export interface TooltipProps {
  // Extra detail only. The trigger has its own visible label or accessible name.
  tip: ReactNode;
  // Renders the trigger, a focusable element, with these props spread on it:
  // {(t) => <button type="button" className="cap-btn" {...t}>Retry job</button>}
  children: (trigger: TriggerProps) => ReactNode;
  // Where the tip sits: above the trigger by default, as shadcn's Tooltip.
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
  // The small arrow pointing at the trigger. On by default.
  arrow?: boolean;
  // The tip's element. "span" keeps it valid inside phrasing content such as a <p>; the tip
  // is then phrasing content too (no block children).
  as?: "div" | "span";
}

// Whether the tip is open is the platform's popover state, not React state: React renders
// the same markup either way, and the behavior module shows and hides it.
export function Tooltip({
  tip,
  children,
  side = "top",
  align,
  arrow = true,
  as: Tip = "div",
}: TooltipProps) {
  const id = useId();
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [tipEl, setTipEl] = useState<HTMLElement | null>(null);
  const ref = useCallback((el: HTMLElement | null) => setTrigger(el), []);
  const tipRef = useCallback((el: HTMLElement | null) => setTipEl(el), []);

  useEffect(() => {
    if (trigger && tipEl) return attach(trigger, tipEl);
  }, [trigger, tipEl]);

  return (
    <>
      {children({ ref, "aria-describedby": id })}
      <Tip
        className="cap-popover"
        data-cap="tooltip"
        data-variant="tooltip"
        data-side={side}
        data-align={align}
        id={id}
        role="tooltip"
        popover="manual"
        ref={tipRef}
      >
        {tip}
        {arrow ? <span className="cap-popover-arrow" aria-hidden="true" /> : null}
      </Tip>
    </>
  );
}
