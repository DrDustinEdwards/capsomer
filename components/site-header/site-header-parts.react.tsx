// The site header's props and the small parts its panels and sheet are built from.

import { createContext, Fragment, type ReactNode, useContext, useEffect, useRef } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";
import type { ThemeChoice, ThemeSave } from "../theme-switch/theme-switch.ts";
import { type Suggest, badgeText, wirePanel } from "./site-header.ts";
import { plainLink } from "../hooks/hooks.react.tsx";

// One link in a panel, the sheet or the bottom bar. `count` is a bubble beside it; `countNote` says
// what it counts, for the accessible name ("Inbox, 4 need you").
export interface HeaderLink {
  id?: string;
  label: string;
  href: string;
  current?: boolean;
  icon?: ReactNode;
  count?: number;
  countNote?: string;
}

// What a row that acts rather than links does. `action` posts a form (`fields` as hidden inputs), so
// it works with no script. `onClick` runs where there is no `action`. The current row posts nothing.
export interface HeaderDoes {
  action?: string;
  method?: "post" | "get";
  fields?: Record<string, string>;
  onClick?: () => void;
}

export interface HeaderActionItem extends HeaderDoes {
  id?: string;
  label: string;
  href?: undefined;
  current?: boolean;
  icon?: ReactNode;
  count?: number;
  countNote?: string;
}

export type HeaderItem = HeaderLink | HeaderActionItem;

export interface HeaderGroup {
  label?: string;
  links: HeaderItem[];
}

// The site's logo: its mark (an svg at most 24px tall) and its name, which is also the link's name.
// `wordmark` is drawn beside the mark instead of `label`.
export interface HeaderLogo {
  href: string;
  label: string;
  className?: string;
  // The link's accessible name, where it says more than `label`; it must start with the visible
  // words (WCAG 2.5.3).
  name?: string;
  mark?: ReactNode;
  wordmark?: ReactNode;
  // The letterhead's names: `agency` small over `label` in bold, and an admin's `app` after it.
  agency?: string;
  app?: string;
}

// A button showing where you are, opening the site's panel. `name` is its accessible name when the
// label alone does not say what it switches. The panel holds `groups`, or the site's own `panel`;
// the sheet lists `groups` under `sheetLabel`.
export interface HeaderSwitcher {
  id: string;
  label: string;
  name?: string;
  tile?: string;
  mark?: ReactNode;
  groups: HeaderGroup[];
  panel?: ReactNode;
  sheetLabel?: string;
  panelSize?: "wide";
  panelClassName?: string;
}

// A section link. With `groups` or a `panel` it is a disclosure button opening a panel; else a
// link. `panelSize: "wide"` is a mega-menu's room (--header-panel-w, 40rem, held inside the window).
export interface HeaderSection {
  id: string;
  label: string;
  href?: string;
  current?: boolean;
  groups?: HeaderGroup[];
  panel?: ReactNode;
  panelSize?: "wide";
  panelClassName?: string;
}

// An extra: up to two icon controls and one button. `keys` is shown in its tip as key caps. An icon
// stays in the phone's top row; the button moves into the sheet, full width.
export interface HeaderExtra {
  id: string;
  label: string;
  kind?: "icon" | "button";
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  count?: number;
  countNote?: string;
  keys?: string;
  // The button extra only: "bar" keeps it in the phone's top row instead of the sheet.
  phone?: "bar";
  // A class of the site's own on the control (the button extra: in the bar and in the sheet).
  className?: string;
}

export interface HeaderAccountLink extends HeaderDoes {
  label: string;
  href?: string;
  current?: boolean;
}

// The account menu: who you are, the site's rows in groups, Sign out last. A site that draws its own
// panel passes `panel` and the same `groups` for the sheet.
export interface HeaderAccount {
  name: string;
  // Drawn as the avatar when there is no picture or it fails to load.
  initials: string;
  // The person's picture address, drawn over the initials.
  avatar?: string;
  detail?: string;
  groups?: Array<{ label?: string; links: HeaderAccountLink[] }>;
  // Sign out: a form post to `signOutAction` (with `signOutFields`, e.g. a CSRF token), which works
  // with no script; else a link (`signOutHref`); else a button (`onSignOut`).
  signOutAction?: string;
  signOutFields?: Record<string, string>;
  onSignOut?: () => void;
  signOutHref?: string;
  signOutDisabled?: boolean;
  panel?: ReactNode;
}

// A part of the sheet a site gives; a function is handed the sheet's close.
export type SheetPart = ReactNode | ((close: () => void) => ReactNode);

export interface SiteHeaderProps {
  logo: HeaderLogo;
  switchers?: HeaderSwitcher[];
  sections?: HeaderSection[];
  links?: "left" | "center" | "right";
  extras?: HeaderExtra[];
  // The theme button. `themeKey` is the single key that switches it, shown in its tip; leave it out
  // where the site binds no single keys. The choice is kept in this browser (`themePrefKey`), in the
  // site's cookie (`themeCookie`, so the server renders the next page in it) and by `onThemeSave`;
  // `themeInitial` is what the server rendered.
  theme?: boolean;
  themePrefKey?: string;
  themeKey?: string;
  themeCookie?: string;
  onThemeSave?: ThemeSave;
  themeInitial?: ThemeChoice;
  // The site's theme route: the theme control becomes a no-script form posting there.
  themeAction?: string;
  account?: HeaderAccount;
  signIn?: { href: string; label?: string };
  variant?: "letterhead";
  // Search: an icon linking to `action` that opens a field under it; the query is sent as `name`
  // (default "q"). `label` names it and is its placeholder. `suggest` answers as the person types.
  search?: { action: string; label: string; name?: string; suggest?: Suggest };
  trail?: { crumbs: Array<{ label: string; href?: string; current?: boolean }>; viewSite?: string };
  // Width under which the bar becomes the phone row with the sheet: 768px, or "lg" for 1024px.
  collapse?: "lg";
  // "auto": the sheet drops its icon column when no row has an icon.
  sheetIcons?: "auto";
  // The menu button's glyph, where a site's own differs from the family's.
  menuIcon?: ReactNode;
  band?: "dark";
  translucent?: boolean;
  // Clear at rest: no ground or line until the header is stuck.
  rest?: "clear";
  // Off only for a header drawn inside a frame that scrolls itself (a specimen).
  sticky?: boolean;
  // The skip link's target, first in the tab order.
  skipTo?: string;
  // The site's own rows at the top of the phone's sheet, and after the switchers and section links.
  sheetStart?: SheetPart;
  sheetEnd?: SheetPart;
  sheetTitle?: string;
  // The label over the plain section links in the sheet; null shows none.
  sheetLinksLabel?: string | null;
  navLabel?: string;
  // False on a page React never hydrates: enhance() wires the header, every panel opens with no
  // script (popovertarget), and nothing here wires itself.
  hydrate?: boolean;
  renderLink?: (props: LinkProps) => ReactNode;
  // The site's own data-* attributes on the <header>; the header's own are set after and win.
  attributes?: Record<`data-${string}`, string>;
  // The site's own markup in the tools (before the phone's menu button), and at the end of the <header>.
  toolsEnd?: ReactNode;
  end?: ReactNode;
}

// Whether React wires the header in the browser (`hydrate`). If not, the behavior module owns every
// listener, so nothing is wired twice.
export const HeaderHydrates = createContext(true);

// One row of a panel or the sheet: a link (`href`), a posting form (`action`) or a button
// (`onClick`). `onClose` closes the sheet first; a panel closes itself on any row.
export function headerItem(
  item: { href?: string; current?: boolean; label: string } & HeaderDoes,
  children: ReactNode,
  renderLink: (p: LinkProps) => ReactNode,
  {
    onClose,
    ariaLabel,
    disabled,
  }: { onClose?: () => void; ariaLabel?: string; disabled?: boolean } = {},
): ReactNode {
  if (item.href)
    return renderLink({
      href: item.href,
      "aria-current": item.current ? "page" : undefined,
      "aria-label": ariaLabel,
      onClick: onClose,
      children,
    });
  const run = () => {
    onClose?.();
    item.onClick?.();
  };
  if (item.action)
    return (
      <form className="cap-site-header-form" method={item.method ?? "post"} action={item.action}>
        {Object.entries(item.fields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type={item.current ? "button" : "submit"}
          data-panel-close=""
          aria-current={item.current ? "true" : undefined}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={run}
        >
          {children}
        </button>
      </form>
    );
  return (
    <button
      type="button"
      data-panel-close=""
      aria-current={item.current ? "true" : undefined}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={run}
    >
      {children}
    </button>
  );
}

const svg = (body: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {body}
  </svg>
);
export const CHEV = (
  <svg className="cap-site-header-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const MENU_ICON = svg(<path d="M4 7h16M4 12h16M4 17h16" />);
export const SEARCH_ICON = svg(<path d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.2-3.2" />);
export const PERSON_ICON = svg(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </>,
);

// "Inbox, 4 need you". Past 99 the badge reads 99+, so the name starts with what is seen and keeps
// the real count ("Inbox 99+, 120 need you"). The visible label and count must be words of the name
// in that order (WCAG 2.5.3; axe's label-content-name-mismatch reads aria-hidden text too).
export const countName = (label: string, count?: number, note?: string): string =>
  count ? `${label}${count > 99 ? " 99+" : ""}, ${count}${note ? ` ${note}` : ""}` : label;

export function TipKeys({ keys }: { keys?: string }) {
  return keys ? (
    <span className="cap-keys">
      {keys.split(" ").map((k) => (
        <kbd key={k}>{k}</kbd>
      ))}
    </span>
  ) : null;
}

// An icon control's name tip, a child of its control. It repeats the name, so it adds no description.
export function HeaderTip({ text, keys }: { text: string; keys?: string }) {
  const tip = useRef<HTMLSpanElement>(null);
  const hydrates = useContext(HeaderHydrates);
  useEffect(() => {
    if (!hydrates) return;
    const el = tip.current;
    const trigger = el?.parentElement;
    if (!el || !trigger) return;
    const detach = attachTip(trigger, el);
    trigger.removeAttribute("aria-describedby");
    const used = () => hideTip(trigger);
    trigger.addEventListener("click", used);
    return () => {
      trigger.removeEventListener("click", used);
      detach();
    };
  }, [hydrates]);
  return (
    <span
      ref={tip}
      className="cap-site-header-tip cap-popover"
      data-variant="tooltip"
      data-side="bottom"
      data-offset="6"
      popover="manual"
      role="tooltip"
      aria-hidden="true"
    >
      <span className="cap-site-header-tip-text">{text}</span>
      <TipKeys keys={keys} />
    </span>
  );
}

// A disclosure button and its panel, wired by the behavior module; the open state is the popover's,
// not React's. `popovertarget` opens it with no script; with script the behavior cancels the native toggle.
export function Disclosure({
  id,
  className,
  label,
  name,
  current,
  align,
  size,
  panelClassName,
  children,
  button,
}: {
  id: string;
  className: string;
  label?: string;
  name?: string;
  current?: boolean;
  align?: "end";
  size?: "wide";
  panelClassName?: string;
  children: ReactNode;
  button: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const hydrates = useContext(HeaderHydrates);
  useEffect(() => {
    if (hydrates && trigger.current && panel.current)
      return wirePanel(trigger.current, panel.current);
  }, [hydrates]);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={className}
        data-cap-part="panel-trigger"
        data-current={current ? "" : undefined}
        popoverTarget={id}
        aria-expanded="false"
        aria-controls={id}
        aria-label={name}
      >
        {button}
      </button>
      <div
        ref={panel}
        id={id}
        className={
          panelClassName ? `cap-site-header-panel ${panelClassName}` : "cap-site-header-panel"
        }
        popover="manual"
        data-align={align}
        data-size={size}
        role="group"
        aria-label={label}
      >
        {children}
      </div>
    </>
  );
}

export function GroupList({
  groups,
  renderLink,
}: {
  groups: HeaderGroup[];
  renderLink: (p: LinkProps) => ReactNode;
}) {
  return (
    <>
      {groups.map((g, i) => (
        <Fragment key={g.label ?? i}>
          {i > 0 && !g.label ? <hr /> : null}
          {g.label ? <div className="cap-site-header-panel-label">{g.label}</div> : null}
          <ul className="cap-site-header-panel-list">
            {g.links.map((l) => (
              <li key={l.id ?? l.href ?? l.label}>
                {headerItem(
                  l,
                  <>
                    {l.icon ? (
                      <span className="cap-site-header-mark" aria-hidden="true">
                        {l.icon}
                      </span>
                    ) : null}
                    {l.label}
                    {l.count ? " " : null}
                    {l.count ? (
                      <span
                        className="cap-count cap-site-header-count"
                        data-tone="need"
                        aria-hidden="true"
                      >
                        {badgeText(l.count)}
                      </span>
                    ) : null}
                  </>,
                  renderLink,
                  { ariaLabel: l.count ? countName(l.label, l.count, l.countNote) : undefined },
                )}
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </>
  );
}

function SheetList({
  links,
  renderLink,
  onClose,
}: {
  links: HeaderItem[];
  renderLink: (p: LinkProps) => ReactNode;
  onClose: () => void;
}) {
  return (
    <ul className="cap-site-header-sheet-list">
      {links.map((l) => (
        <li key={l.id ?? l.href ?? l.label}>
          {headerItem(
            l,
            <>
              <span className="cap-site-header-sheet-icon" aria-hidden="true">
                {l.icon}
              </span>
              <span className="cap-site-header-sheet-name">{l.label}</span>
              {l.count ? " " : null}
              {l.count ? (
                <span
                  className="cap-count cap-site-header-count"
                  data-tone="need"
                  aria-hidden="true"
                >
                  {badgeText(l.count)}
                </span>
              ) : null}
            </>,
            renderLink,
            {
              onClose,
              ariaLabel: l.count ? countName(l.label, l.count, l.countNote) : undefined,
            },
          )}
        </li>
      ))}
    </ul>
  );
}

export function SheetGroup({
  label,
  links,
  renderLink = plainLink,
  onClose,
}: {
  label?: string;
  links: HeaderItem[];
  renderLink?: (p: LinkProps) => ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      {label ? <div className="cap-site-header-sheet-label">{label}</div> : null}
      <SheetList links={links} renderLink={renderLink} onClose={onClose} />
    </>
  );
}

export const part = (p: SheetPart, close: () => void) => (typeof p === "function" ? p(close) : p);
