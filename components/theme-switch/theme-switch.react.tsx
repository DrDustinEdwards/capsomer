import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import { attach as attachTip } from "../tooltip/tooltip.ts";
import { applyTheme, effectiveTheme, readTheme, themeButtonLabel, THEME_PREF, toggleTheme, type ThemeChoice } from "./theme-switch.ts";

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

export interface ThemeButtonProps {
  // The localStorage key; "cap-theme" by default.
  prefKey?: string;
  // The key the app binds to toggleTheme(), shown in the tip as a key cap ("T"). The app binds it.
  shortcut?: string;
  // Extra classes: the site header adds its own icon-control class.
  className?: string;
  // What the server rendered (from a cookie); leave it out and the label follows the page once
  // it mounts. The icon follows the page by CSS either way.
  initial?: ThemeChoice;
}

// The 24-box icons the header's controls use (1.6 stroke): a moon while the page is light (press
// for dark), a sun while it is dark. Both are in the markup; CSS shows the one for the theme that
// is showing, so the picture is right before any script runs.
const BUTTON_MOON = (
  <svg className="cap-theme-icon" data-show="light" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
);
const BUTTON_SUN = (
  <svg className="cap-theme-icon" data-show="dark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

// The button's tip: its name again, and the key that does the same, shown on hover and keyboard focus.
function ThemeTip({ ref, label, shortcut }: { ref?: Ref<HTMLSpanElement>; label: string; shortcut?: string }) {
  return (
    <span ref={ref} className="cap-theme-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true">
      <span className="cap-theme-tip-text">{label}</span>
      {shortcut ? (
        <span className="cap-keys">
          <kbd>{shortcut}</kbd>
        </span>
      ) : null}
    </span>
  );
}

// The theme as one icon button (the site header's theme control, Dustin's answer 2 of
// 2026-10-13): Light and Dark only, no System; it says what it does, "Switch to dark theme", in
// its name and its tip.
export function ThemeButton({ prefKey = THEME_PREF, shortcut, className, initial }: ThemeButtonProps) {
  const [showing, setShowing] = useState<ThemeChoice>(initial ?? "light");
  const button = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const t = readTheme(prefKey);
    if (t) applyTheme(t, { key: prefKey, remember: false });
    setShowing(effectiveTheme());
    const onTheme = (e: Event) => setShowing((e as CustomEvent<{ choice: ThemeChoice }>).detail?.choice ?? effectiveTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => setShowing(effectiveTheme());
    document.addEventListener("cap-theme", onTheme);
    media.addEventListener("change", onSystem);
    return () => {
      document.removeEventListener("cap-theme", onTheme);
      media.removeEventListener("change", onSystem);
    };
  }, [prefKey]);
  useEffect(() => {
    const b = button.current;
    if (!b || !tip.current) return;
    const detach = attachTip(b, tip.current);
    b.removeAttribute("aria-describedby");
    return detach;
  }, []);
  const label = themeButtonLabel(showing);
  return (
    <button ref={button} type="button" className={className ? `cap-theme-button ${className}` : "cap-theme-button"} data-cap="theme-switch" data-variant="button" data-cap-ready="" aria-label={label} onClick={() => setShowing(toggleTheme(prefKey))}>
      {BUTTON_MOON}
      {BUTTON_SUN}
      <ThemeTip ref={tip} label={label} shortcut={shortcut} />
    </button>
  );
}

export interface ThemeFormProps {
  // The site's theme route: a post with theme=light or theme=dark sets the cookie and comes back.
  action?: string;
  // The cookie the press writes with script, so the server reads the same choice; "theme" by default.
  cookie?: string;
  // Extra classes for both buttons: the site header adds its own icon-control class.
  className?: string;
  // The key the site binds to the theme, shown in the tips as a key cap. The site binds it.
  shortcut?: string;
  // Also remember the choice under this localStorage key, for a part of the site whose shell reads it.
  prefKey?: string;
}

function FormButton({ value, show, label, icon, className, shortcut }: { value: ThemeChoice; show: ThemeChoice; label: string; icon: ReactNode; className?: string; shortcut?: string }) {
  return (
    <button type="submit" name="theme" value={value} className={className ? `cap-theme-button ${className}` : "cap-theme-button"} data-show={show} aria-label={label}>
      {icon}
      <ThemeTip label={label} shortcut={shortcut} />
    </button>
  );
}

// The theme button for a site that keeps the choice in a cookie and works with no script
// (data-variant="form", 0.22.0): two real submit buttons, one shown by CSS, each saying what it
// does. Pure markup, so a server render and the browser agree; capsomer/behavior/theme-switch's
// enhance() makes a press switch at once and write the cookie.
export function ThemeForm({ action = "/theme", cookie, className, shortcut, prefKey }: ThemeFormProps) {
  return (
    <form method="post" action={action} className="cap-theme-form" data-cap="theme-switch" data-variant="form" data-cap-cookie={cookie} data-cap-pref={prefKey}>
      <FormButton value="dark" show="light" label={themeButtonLabel("light")} icon={BUTTON_MOON} className={className} shortcut={shortcut} />
      <FormButton value="light" show="dark" label={themeButtonLabel("dark")} icon={BUTTON_SUN} className={className} shortcut={shortcut} />
    </form>
  );
}
