import { useEffect, useId, useState, type ReactNode } from "react";
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

const Sun = () => (
  <svg className="cap-theme-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
  </svg>
);
const Moon = () => (
  <svg className="cap-theme-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M13.5 9.3A5.5 5.5 0 0 1 6.7 2.5a5.5 5.5 0 1 0 6.8 6.8z" />
  </svg>
);

const CHOICES: Array<{ value: ThemeChoice; label: string; icon: ReactNode }> = [
  { value: "light", label: "Light", icon: <Sun /> },
  { value: "dark", label: "Dark", icon: <Moon /> },
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
    <fieldset className="cap-theme" data-cap="theme-switch">
      <legend className="cap-sr-only">{legend}</legend>
      <div className="cap-theme-options">
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
            {c.icon}
            <span className="cap-theme-text">{c.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
