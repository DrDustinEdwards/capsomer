// The site header's props and the small parts its panels and sheet are built from (site-header.react.tsx).

import { createContext, Fragment, type ReactNode, useContext, useEffect, useRef } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";
import type { ThemeChoice, ThemeSave } from "../theme-switch/theme-switch.ts";
import { type Suggest, badgeText, wirePanel } from "./site-header.ts";

// One link in a panel, the sheet or the bottom bar. `count` is a bubble beside it (99+ past 99);
// `countNote` says what it counts, for its accessible name: "Inbox, 4 need you".
export interface HeaderLink {
  id?: string;
  label: string;
  href: string;
  current?: boolean;
  icon?: ReactNode;
  count?: number;
  countNote?: string;
}

// What a row that does something, rather than going somewhere, does. `action` posts a form (with
// `fields` as hidden inputs), so it works with no script and a server answers it: Sign out, an
// account switch, any row that changes state on the server. `onClick` runs instead where there is
// no `action`. The row you are on (`current`) posts nothing.
export interface HeaderDoes {
  action?: string;
  method?: "post" | "get";
  fields?: Record<string, string>;
  onClick?: () => void;
}

// A row in a panel or the sheet that posts or runs rather than links (HeaderDoes).
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

// A group of rows under a quiet label, in a panel or the sheet.
export interface HeaderGroup {
  label?: string;
  links: HeaderItem[];
}

// The site's logo: its mark (an svg at most 24px tall) and its name, which is also the link's name.
// `wordmark` is what is drawn beside the mark; leave it out to show `label`.
export interface HeaderLogo {
  href: string;
  label: string;
  // A class of the site's own on the logo link, for its wordmark's look.
  className?: string;
  mark?: ReactNode;
  wordmark?: ReactNode;
  // The letterhead's names: `agency` small over `label` in bold, and an admin's `app` after it in
  // the regular weight ("Dustin Edwards" over "Capsid Portal"). The headquarters site has no agency.
  agency?: string;
  app?: string;
}

// A button showing where you are, opening the site's panel: Foxhound's business ("Acme Supply
// Co.", with `tile` "A" in a square) and its product ("Recovery"). `name` is its accessible name
// when the label alone does not say what it switches ("Business: Acme Supply Co."). The panel holds
// `groups`, or the site's own `panel`; the sheet lists `groups` under `sheetLabel`.
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
// link. Its panel's contents and layout are the site's. `panelSize: "wide"` is a mega-menu's room
// (--header-panel-w, 40rem, held inside the window); `panelClassName` is the site's own class on
// the panel, for its look (dustinedwards.info's structured panels).
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

// An extra: up to two icon controls (Search, Inbox, the bell) and one button (Free audit, Join
// free). `keys` is shown in its tip as key caps ("Ctrl K"). An icon extra stays in the phone's top
// row; the button moves into the sheet, full width.
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
  // The button extra only: "bar" keeps it in the phone's top row instead of the sheet (a site
  // whose one action must never need the menu, germomics' Subscribe).
  phone?: "bar";
}

export interface HeaderAccountLink extends HeaderDoes {
  label: string;
  href?: string;
  current?: boolean;
}

// The account menu, the same shape everywhere: who you are; the site's own rows in groups (a
// business's settings under its name, "Admin" for an admin, "View site" and "Help" in an admin);
// Sign out last. A site that draws its own panel (Foxing) passes `panel` and the same `groups` for
// the sheet.
export interface HeaderAccount {
  name: string;
  // Drawn as the avatar when there is no picture, or under one that fails to load.
  initials: string;
  // A picture of the person (its address), drawn over the initials in the account button.
  avatar?: string;
  detail?: string;
  groups?: Array<{ label?: string; links: HeaderAccountLink[] }>;
  // Sign out, last: a form post to `signOutAction` (with `signOutFields`, a CSRF token say),
  // which works with no script; else a link (`signOutHref`); else a button (`onSignOut`).
  signOutAction?: string;
  signOutFields?: Record<string, string>;
  onSignOut?: () => void;
  signOutHref?: string;
  signOutDisabled?: boolean;
  panel?: ReactNode;
}

// A part of the sheet a site gives; as a function it is handed the sheet's close for its links.
export type SheetPart = ReactNode | ((close: () => void) => ReactNode);

export interface SiteHeaderProps {
  logo: HeaderLogo;
  switchers?: HeaderSwitcher[];
  sections?: HeaderSection[];
  // Where the section links sit: after the switcher (left), centered in the header (center), or on
  // the right before the extras, after a thin divider (right).
  links?: "left" | "center" | "right";
  extras?: HeaderExtra[];
  // The theme button; on by default. `themeKey` is the single key the header binds to switch it
  // ("T"), shown in its tip; leave it out where the site does not bind single keys. A person's
  // choice is kept in this browser (`themePrefKey`), in the site's cookie (`themeCookie`, so its
  // server renders the next page in it) and by the site's own save (`onThemeSave`, the signed-in
  // account); `themeInitial` is what the server rendered (theme-switch.md).
  theme?: boolean;
  themePrefKey?: string;
  themeKey?: string;
  themeCookie?: string;
  onThemeSave?: ThemeSave;
  themeInitial?: ThemeChoice;
  // The site's theme route: the theme is then the no-script form (ThemeForm), two submit buttons
  // posting there, for a site that must switch with no script (dustinedwards.info's /theme).
  themeAction?: string;
  // Signed in: the avatar menu. Signed out: Sign in holds its place, last.
  account?: HeaderAccount;
  signIn?: { href: string; label?: string };
  // The family letterhead: the band in the page's text color under the family's stripe, the names
  // beside the mark, the section links in a second row at every width (components/site-header).
  variant?: "letterhead";
  // Search: an icon linking to `action` (the site's search page) that opens a field under it, the
  // query sent as `name` (default "q"). `label` names it and is its placeholder ("Search Capsid").
  // `suggest` answers each query as it is typed, and its matches drop down under the field (wireSearch).
  search?: { action: string; label: string; name?: string; suggest?: Suggest };
  // An admin's second row in the letterhead: where you are, and View site.
  trail?: { crumbs: Array<{ label: string; href?: string; current?: boolean }>; viewSite?: string };
  // The band: dark in both themes, and translucent over the page.
  band?: "dark";
  translucent?: boolean;
  // Clear at rest: no ground or line until the header is stuck (a scroll-state query).
  rest?: "clear";
  // Off only for a header drawn inside a frame that scrolls itself (a specimen).
  sticky?: boolean;
  // The skip link's target, first in the tab order ("#main").
  skipTo?: string;
  // The site's own rows at the top of the phone's sheet (in your admin, the family's apps), and
  // what follows the switchers and the section links (in your admin and a dashboard, the menu).
  // A function is given the sheet's close, for its links.
  sheetStart?: SheetPart;
  sheetEnd?: SheetPart;
  // The sheet's heading; default "<name> menu".
  sheetTitle?: string;
  // The label over the plain section links in the sheet: "Pages", or "More" after grouped
  // sections. null shows none (a one-list sheet).
  sheetLinksLabel?: string | null;
  // The section links' nav name: "Main" by default.
  navLabel?: string;
  // False on a page React never runs on in the browser (a public plane that does not hydrate):
  // the header is written for capsomer/behavior/site-header's enhance() to wire, every panel opens
  // with no script at all (popovertarget), and nothing here wires itself.
  hydrate?: boolean;
  renderLink?: (props: LinkProps) => ReactNode;
  // The site's own data attributes on the <header> (a command palette's hooks, say). Only data-*
  // names: the header's own attributes are set after these and win.
  attributes?: Record<`data-${string}`, string>;
  // The site's own markup in the tools, after the theme control and the account (before the
  // phone's menu button), and at the very end of the <header>: an island's <template>, say.
  toolsEnd?: ReactNode;
  end?: ReactNode;
}

export const plainLink = ({ children, ...props }: LinkProps) => <a {...props}>{children}</a>;

// Whether React wires the header in the browser (SiteHeader's `hydrate`). Where it does not, the
// parts leave every listener to the behavior module, so nothing is wired twice.
export const HeaderHydrates = createContext(true);

// One row of a panel or the sheet, as what it does: a link (`href`), a form that posts
// (`action`), or a button (`onClick`). `onClose` closes the sheet first; a panel closes itself on
// any row (data-panel-close).
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

// "Inbox, 4 need you": a count is in the name, with what it counts. Past 99 the badge reads 99+,
// so the name starts with what is seen and keeps the real count: "Inbox 99+, 120 need you". The
// visible label and count must be words of the name in that order (WCAG 2.5.3; axe-core 4.14's
// label-content-name-mismatch reads aria-hidden text too).
export const countName = (label: string, count?: number, note?: string): string =>
  count ? `${label}${count > 99 ? " 99+" : ""}, ${count}${note ? ` ${note}` : ""}` : label;

// A tip's key caps ("G 2"), after its words.
export function TipKeys({ keys }: { keys?: string }) {
  return keys ? (
    <span className="cap-keys">
      {keys.split(" ").map((k) => (
        <kbd key={k}>{k}</kbd>
      ))}
    </span>
  ) : null;
}

// An icon control's name, shown on hover and keyboard focus: Capsomer's one tooltip, a child of
// its control, below the header's controls. It repeats the control's name, so it adds no
// description; a press hides it.
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

// A disclosure button and its panel, wired by the behavior module (the open state is the
// platform's popover state, not React's). `popovertarget` opens the panel before any script runs,
// or where none does; with script the behavior takes the click (it cancels the native toggle).
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
                      <span className="cap-site-header-count" aria-hidden="true">
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
                <span className="cap-site-header-count" aria-hidden="true">
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

// A labeled group of rows in the sheet, for a site's own rows (your admin's apps, its menu).
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
