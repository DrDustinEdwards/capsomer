import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { stateWord } from "./switch.ts";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "checked" | "defaultChecked" | "onChange" | "style"> {
  // A fixed noun: what is switched, never the state ("Single-key shortcuts").
  label: ReactNode;
  // Controlled; leave it out for a switch that keeps its own state.
  checked?: boolean;
  defaultChecked?: boolean;
  // Called at once with the new state: a switch takes effect without a Save.
  onCheckedChange?: (checked: boolean) => void;
  onWord?: string;
  offWord?: string;
  // A request for the change is running: drawn as a dashed outline, and not disabled.
  busy?: boolean;
}

export function Switch(props: SwitchProps) {
  const { label, checked, defaultChecked = false, onCheckedChange, onWord, offWord, busy, className, ...rest } = props;
  const [own, setOwn] = useState(defaultChecked);
  const on = checked ?? own;
  return (
    <label className={className ? `cap-switch ${className}` : "cap-switch"}>
      <input
        {...rest}
        type="checkbox"
        role="switch"
        aria-busy={busy || undefined}
        checked={on}
        onChange={(e) => {
          setOwn(e.target.checked);
          onCheckedChange?.(e.target.checked);
        }}
      />{" "}
      {label}{" "}
      <span className="cap-switch-state" aria-hidden="true">
        {stateWord(on, onWord, offWord)}
      </span>
    </label>
  );
}
