import { useEffect, useId, useState } from "react";
import { applyTheme, readTheme, themeChoice, THEME_PREF, type ThemeChoice } from "./theme-switch.ts";

export interface ThemeSwitchProps {
  // The localStorage key; "cap-theme" by default.
  prefKey?: string;
  // The group's name, read by a screen reader; hidden from sight in a top bar.
  legend?: string;
  // What the server rendered (from a cookie), before the stored choice is read.
  initial?: ThemeChoice;
}

const CHOICES: Array<{ value: ThemeChoice; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeSwitch({ prefKey = THEME_PREF, legend = "Theme", initial = "system" }: ThemeSwitchProps) {
  const name = useId();
  const [choice, setChoice] = useState<ThemeChoice>(initial);

  useEffect(() => {
    // Remembered, else what the page shows (right when storage cannot be read).
    setChoice(readTheme(prefKey) ?? themeChoice());
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
