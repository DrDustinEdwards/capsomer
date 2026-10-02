import { createContext, useContext, useId, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { nextTab, type Activation, type Orientation } from "./tabs.ts";

// Renders the HTML contract in tabs.md. The chosen tab, the roving tabindex and the hidden
// panels are React state, so the markup a server renders is the markup a client hydrates.
// Every panel is rendered (the inactive ones `hidden`), so the page's content is in the HTML.
// Tab values are short tokens (letters, digits, dashes): they become part of the ids.
interface TabsContext {
  base: string;
  value: string;
  stop: string;
  orientation: Orientation;
  activation: Activation;
  choose: (value: string) => void;
  setStop: (value: string) => void;
}
const Ctx = createContext<TabsContext | null>(null);
function useTabs(): TabsContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("Tabs parts go inside <Tabs>");
  return c;
}

export interface TabsProps extends Omit<ComponentProps<"div">, "onChange" | "defaultValue"> {
  // Controlled: the chosen tab, with onValueChange. Or uncontrolled: defaultValue.
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: Orientation;
  // "automatic" (default): an arrow key chooses the tab it lands on. "manual": it only moves
  // focus, and Enter or Space chooses (for panels that are slow to show).
  activation?: Activation;
}

export function Tabs({ value, defaultValue = "", onValueChange, orientation = "horizontal", activation = "automatic", className, children, ...props }: TabsProps) {
  const base = useId();
  const [own, setOwn] = useState(defaultValue);
  const chosen = value ?? own;
  const [moved, setMoved] = useState<string | null>(null);
  const choose = (v: string) => {
    setOwn(v);
    setMoved(null);
    if (v !== chosen) onValueChange?.(v);
  };
  return (
    <Ctx.Provider value={{ base, value: chosen, stop: moved ?? chosen, orientation, activation, choose, setStop: setMoved }}>
      <div className={className ? `cap-tabs ${className}` : "cap-tabs"} data-orientation={orientation === "vertical" ? "vertical" : undefined} data-activation={activation === "manual" ? "manual" : undefined} {...props}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export interface TabsListProps extends ComponentProps<"div"> {
  // The list needs a name: "Posts", "Settings sections".
  "aria-label": string;
  variant?: "default" | "line";
  size?: "sm" | "default" | "lg";
  fill?: boolean;
}

export function TabsList({ variant = "default", size = "default", fill, className, onKeyDown, onBlur, children, ...props }: TabsListProps) {
  const c = useTabs();
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const tabs = [...e.currentTarget.querySelectorAll<HTMLElement>(":scope > [role='tab']")];
    const enabled = tabs.flatMap((t, i) => (t.getAttribute("aria-disabled") === "true" ? [] : [i]));
    const current = tabs.findIndex((t) => t === document.activeElement);
    const to = nextTab(enabled, current, e.key, c.orientation, getComputedStyle(e.currentTarget).direction === "rtl");
    const target = to === null ? undefined : tabs[to];
    if (!target) return;
    e.preventDefault();
    target.focus();
    if (c.activation === "automatic") target.click();
    else c.setStop(target.id.slice(`${c.base}-tab-`.length));
  };
  return (
    <div
      role="tablist"
      aria-orientation={c.orientation === "vertical" ? "vertical" : undefined}
      className={className ? `cap-tabs-list ${className}` : "cap-tabs-list"}
      data-variant={variant === "line" ? "line" : undefined}
      data-size={size === "default" ? undefined : size}
      data-fill={fill ? "" : undefined}
      onKeyDown={keys}
      onBlur={(e) => {
        onBlur?.(e);
        if (!e.currentTarget.contains(e.relatedTarget)) c.setStop(c.value);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends Omit<ComponentProps<"button">, "value"> {
  value: string;
  // A number beside the label. The accessible name reads "Open 12".
  count?: number;
  disabled?: boolean;
}

export function TabsTrigger({ value, count, disabled, className, onClick, children, ...props }: TabsTriggerProps) {
  const c = useTabs();
  const on = c.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${c.base}-tab-${value}`}
      aria-selected={on}
      aria-controls={`${c.base}-panel-${value}`}
      aria-disabled={disabled ? true : undefined}
      tabIndex={c.stop === value ? 0 : -1}
      className={className ? `cap-tab ${className}` : "cap-tab"}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented && !disabled) c.choose(value);
      }}
      {...props}
    >
      {children}
      {count != null ? <span className="cap-tab-count">{count}</span> : null}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }: ComponentProps<"div"> & { value: string }) {
  const c = useTabs();
  return (
    <div role="tabpanel" id={`${c.base}-panel-${value}`} aria-labelledby={`${c.base}-tab-${value}`} tabIndex={0} hidden={c.value !== value} className={className ? `cap-tabs-panel ${className}` : "cap-tabs-panel"} {...props}>
      {children}
    </div>
  );
}

// Tabs that are pages: a nav of links, the current one `aria-current="page"`. No tab roles,
// no arrow keys: each link is a tab stop, as links are.
export interface TabsNavProps extends ComponentProps<"nav"> {
  "aria-label": string;
  variant?: "default" | "line";
  size?: "sm" | "default" | "lg";
  fill?: boolean;
}

export function TabsNav({ variant = "default", size = "default", fill, className, children, ...props }: TabsNavProps) {
  return (
    <nav className={className ? `cap-tabs-list ${className}` : "cap-tabs-list"} data-variant={variant === "line" ? "line" : undefined} data-size={size === "default" ? undefined : size} data-fill={fill ? "" : undefined} {...props}>
      {children}
    </nav>
  );
}

export function TabLink({ current, count, className, children, ...props }: ComponentProps<"a"> & { current?: boolean; count?: number; children: ReactNode }) {
  return (
    <a className={className ? `cap-tab ${className}` : "cap-tab"} aria-current={current ? "page" : undefined} {...props}>
      {children}
      {count != null ? <span className="cap-tab-count">{count}</span> : null}
    </a>
  );
}
