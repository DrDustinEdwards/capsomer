// The site header's props: the links, rows, sections, account and every slot a site may give (the parts and
// site-header.react.tsx draw them).
import type { ReactNode } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import type { ThemeChoice, ThemeSave } from "../theme-switch/theme-switch.ts";
import type { Suggest } from "./site-header.ts";

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
