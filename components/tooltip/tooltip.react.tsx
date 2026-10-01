import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
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
}

// Whether the tip is open is the platform's popover state, not React state: React renders
// the same markup either way, and the behaviour module shows and hides it.
export function Tooltip({ tip, children }: TooltipProps) {
  const id = useId();
  const tipRef = useRef<HTMLDivElement>(null);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const ref = useCallback((el: HTMLElement | null) => setTrigger(el), []);

  useEffect(() => {
    if (trigger && tipRef.current) return attach(trigger, tipRef.current);
  }, [trigger]);

  return (
    <>
      {children({ ref, "aria-describedby": id })}
      <div className="cap-tip" id={id} role="tooltip" popover="manual" ref={tipRef}>
        {tip}
      </div>
    </>
  );
}
