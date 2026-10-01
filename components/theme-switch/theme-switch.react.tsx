import { useEffect, useId, useState } from "react";
import { applyTheme, effectiveTheme, readTheme, THEME_PREF, type ThemeChoice } from "./theme-switch.ts";

export interface ThemeSwitchProps {
  // The localStorage key; "cap-theme" by default.
  prefKey?: string;
  // The group's name, read by a screen reader; hidden from sight in a top bar.
  legend?: string;
  // What the server rendered (from a cookie), before the stored choice is read. Leave it out
  // and the control shows the operating system's theme once it mounts.
  initial?: ThemeChoice;
}

const CHOICES: Array<{ value: ThemeChoice; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeSwitch({ prefKey = THEME_PREF, legend = "Theme", initial }: ThemeSwitchProps) {
  const name = useId();
  const [choice, setChoice] = useState<ThemeChoice | null>(initial ?? null);

  useEffect(() => {
    // Remembered, else what the page shows: the system's theme on a first visit.
    setChoice(readTheme(prefKey) ?? effectiveTheme());
    const onTheme = (e: Event) => {
      const c = (e as CustomEvent<{ choice: ThemeChoice }>).detail?.choice;
      if (c) setChoice(c);
    };
    document.addEventListener("cap-theme", onTheme);
    return () => document.removeEventListener("cap-theme", onTheme);
  }, [prefKey]);

  return (
    <fieldset className="cap-seg cap-theme" data-cap="theme-switch">
      <legend className="cap-sr-only">{legend}</legend>
      <div className="cap-seg-options">
        {CHOICES.map((c) => (
          <label key={c.value}>
            <input
              type="radio"
              name={name}
              value={c.value}
              checked={choice === c.value}
              onChange={() => {
                setChoice(c.value);
                applyTheme(c.value, { key: prefKey });
              }}
            />
            {c.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
