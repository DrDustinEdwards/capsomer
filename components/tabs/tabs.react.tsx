import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  FINDS_HIDDEN,
  attachPillDrag,
  guessPlatform,
  nextTab,
  onRemembered,
  pageTabHref,
  readRemembered,
  setPanelHidden,
  writeRemembered,
  type Activation,
  type Orientation,
} from "./tabs.ts";

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
  // Remembers the reader's choice on this device under this key, and follows a choice made in any
  // other tab set with the same key (tabs.ts, readRemembered). Read after hydration, so the server's
  // tab paints first. `rememberGuess="platform"` starts from the reader's system when nothing is kept.
  remember?: string;
  rememberGuess?: "platform";
}

export function Tabs({
  value,
  defaultValue = "",
  onValueChange,
  orientation = "horizontal",
  activation = "automatic",
  remember,
  rememberGuess,
  className,
  children,
  ...props
}: TabsProps) {
  const base = useId();
  const [own, setOwn] = useState(defaultValue);
  const chosen = value ?? own;
  const [moved, setMoved] = useState<string | null>(null);
  const latest = useRef({ chosen, onValueChange });
  useEffect(() => {
    latest.current = { chosen, onValueChange };
  });
  const choose = (v: string) => {
    setOwn(v);
    setMoved(null);
    if (v !== chosen) onValueChange?.(v);
    if (remember) writeRemembered(remember, v);
  };
  useEffect(() => {
    if (!remember) return;
    // Only a tab this set has, and one that can be chosen.
    const apply = (v: string | null) => {
      const tab = v ? document.getElementById(`${base}-tab-${v}`) : null;
      if (!v || !tab || tab.getAttribute("aria-disabled") === "true") return false;
      setOwn(v);
      setMoved(null);
      if (v !== latest.current.chosen) latest.current.onValueChange?.(v);
      return true;
    };
    if (!apply(readRemembered(remember)) && rememberGuess === "platform") apply(guessPlatform());
    return onRemembered(remember, apply);
  }, [remember, rememberGuess, base]);
  return (
    <Ctx.Provider
      value={{
        base,
        value: chosen,
        stop: moved ?? chosen,
        orientation,
        activation,
        choose,
        setStop: setMoved,
      }}
    >
      <div
        className={className ? `cap-tabs ${className}` : "cap-tabs"}
        data-orientation={orientation === "vertical" ? "vertical" : undefined}
        data-activation={activation === "manual" ? "manual" : undefined}
        {...props}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export interface TabsListProps extends ComponentProps<"div"> {
  // The list needs a name: "Posts", "Settings sections".
  "aria-label": string;
  // "pill": a rounded tray whose mark a pointer can drag from tab to tab (tabs.ts, attachPillDrag).
  variant?: "default" | "line" | "pill";
  size?: "sm" | "default" | "lg";
  fill?: boolean;
}

export function TabsList({
  variant = "default",
  size = "default",
  fill,
  className,
  onKeyDown,
  onBlur,
  children,
  ...props
}: TabsListProps) {
  const c = useTabs();
  const list = useRef<HTMLDivElement>(null);
  // The pill's drag ends in a click on the tab it settles on, so the choice is the trigger's own.
  useEffect(() => {
    const el = list.current;
    if (!el || variant !== "pill") return;
    return attachPillDrag(el, (tab) => tab.click());
  }, [variant]);
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const tabs = [...e.currentTarget.querySelectorAll<HTMLElement>(":scope > [role='tab']")];
    const enabled = tabs.flatMap((t, i) => (t.getAttribute("aria-disabled") === "true" ? [] : [i]));
    const current = tabs.findIndex((t) => t === document.activeElement);
    const to = nextTab(
      enabled,
      current,
      e.key,
      c.orientation,
      getComputedStyle(e.currentTarget).direction === "rtl",
    );
    const target = to === null ? undefined : tabs[to];
    if (!target) return;
    e.preventDefault();
    target.focus();
    if (c.activation === "automatic") target.click();
    else c.setStop(target.id.slice(`${c.base}-tab-`.length));
  };
  return (
    // oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- focus goes to the tabs inside (roving tabindex), not the list
    <div
      ref={list}
      role="tablist"
      aria-orientation={c.orientation === "vertical" ? "vertical" : undefined}
      className={className ? `cap-tabs-list ${className}` : "cap-tabs-list"}
      data-variant={variant === "default" ? undefined : variant}
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

export type TabTone = "accent" | "info" | "ok" | "warn" | "crit";

export interface TabsTriggerProps extends Omit<ComponentProps<"button">, "value"> {
  value: string;
  // The pill variant's mark takes this tone while the tab is chosen (or under a drag).
  tone?: TabTone;
  // A number beside the label. The accessible name reads "Open 12".
  count?: number;
  disabled?: boolean;
}

export function TabsTrigger({
  value,
  count,
  tone,
  disabled,
  className,
  onClick,
  children,
  ...props
}: TabsTriggerProps) {
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
      data-tone={tone}
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

export function TabsContent({
  value,
  className,
  children,
  ...props
}: ComponentProps<"div"> & { value: string }) {
  const c = useTabs();
  const ref = useRef<HTMLDivElement>(null);
  const hide = c.value !== value;
  const { choose } = c;
  // The server renders a plain `hidden`; once hydrated, an inactive panel becomes `hidden="until-found"` where the
  // browser has it, and a find-in-page match inside it chooses this tab (tabs.ts, FINDS_HIDDEN).
  useEffect(() => {
    const el = ref.current;
    if (!el || !FINDS_HIDDEN) return;
    setPanelHidden(el, hide);
    const onMatch = (e: Event) => {
      if (e.target === el) choose(value);
    };
    el.addEventListener("beforematch", onMatch);
    return () => el.removeEventListener("beforematch", onMatch);
  }, [hide, choose, value]);
  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`${c.base}-panel-${value}`}
      aria-labelledby={`${c.base}-tab-${value}`}
      tabIndex={0}
      hidden={hide}
      className={className ? `cap-tabs-panel ${className}` : "cap-tabs-panel"}
      {...props}
    >
      {children}
    </div>
  );
}

// Tabs that are pages: a nav of links, the current one `aria-current="page"`. No tab roles,
// no arrow keys: each link is a tab stop, as links are.
// What a router's link component is given: a plain `<a>`'s props with `href` always set, the
// tab's class and `aria-current` already on it. Return the router's `<Link to={props.href} {...props} />`.
export type RenderTabLink = (props: ComponentProps<"a"> & { href: string }) => ReactNode;

const NavLinks = createContext<RenderTabLink | undefined>(undefined);

export interface TabsNavProps extends ComponentProps<"nav"> {
  "aria-label": string;
  variant?: "default" | "line" | "pill";
  size?: "sm" | "default" | "lg";
  fill?: boolean;
  // The link slot for every `TabLink` inside: how an app's router draws a link (a client-side
  // navigation), so a tab link is a router link and still carries the tab's look and state.
  renderLink?: RenderTabLink;
}

export function TabsNav({
  variant = "default",
  size = "default",
  fill,
  className,
  children,
  renderLink,
  ...props
}: TabsNavProps) {
  const nav = (
    <nav
      className={className ? `cap-tabs-list ${className}` : "cap-tabs-list"}
      data-variant={variant === "default" ? undefined : variant}
      data-size={size === "default" ? undefined : size}
      data-fill={fill ? "" : undefined}
      {...props}
    >
      {children}
    </nav>
  );
  return renderLink ? <NavLinks.Provider value={renderLink}>{nav}</NavLinks.Provider> : nav;
}

export interface TabLinkProps extends Omit<ComponentProps<"a">, "href"> {
  href: string;
  current?: boolean;
  count?: number;
  children: ReactNode;
  // This link only: how the router draws it. Wins over the nav's `renderLink`.
  renderLink?: RenderTabLink;
}

export function TabLink({
  current,
  count,
  className,
  children,
  renderLink,
  ...props
}: TabLinkProps) {
  const inherited = useContext(NavLinks);
  const draw = renderLink ?? inherited;
  const inner = (
    <>
      {children}
      {count != null ? <span className="cap-tab-count">{count}</span> : null}
    </>
  );
  const linkProps = {
    className: className ? `cap-tab ${className}` : "cap-tab",
    "aria-current": current ? ("page" as const) : undefined,
    ...props,
    children: inner,
  };
  return draw ? <>{draw(linkProps)}</> : <a {...linkProps}>{inner}</a>;
}

// Page tabs: each tab is the page's own address with ?tab=<id> (the first tab the bare address),
// so Back, a bookmark and a reload reach it; the page's other query parameters are kept. The app
// reads the tab from its router's search (tabParam in tabs.ts) and passes `search` and `current`;
// `renderLink` is the router's link, as for TabsNav.
export interface PageTab {
  id: string;
  label: ReactNode;
  count?: number;
  // A fuller name when the label and count are not enough ("Drafts, 21 posts").
  "aria-label"?: string;
}

export interface PageTabsProps extends Omit<TabsNavProps, "children"> {
  // The page's path, without the query: "/agents".
  path: string;
  // The address's query as the router has it ("?q=draft" or "q=draft"): kept on every tab.
  search?: string;
  tabs: ReadonlyArray<PageTab>;
  // The id of the tab the address names.
  current: string;
  // The query parameter: "tab" by default.
  param?: string;
}

export function PageTabs({
  path,
  search = "",
  tabs,
  current,
  param = "tab",
  variant = "line",
  ...props
}: PageTabsProps) {
  const first = tabs[0]?.id;
  return (
    <TabsNav variant={variant} {...props}>
      {tabs.map((t) => (
        <TabLink
          key={t.id}
          href={pageTabHref(path, search, t.id, first, param)}
          current={t.id === current}
          count={t.count}
          aria-label={t["aria-label"]}
          data-tab={t.id}
        >
          {t.label}
        </TabLink>
      ))}
    </TabsNav>
  );
}
