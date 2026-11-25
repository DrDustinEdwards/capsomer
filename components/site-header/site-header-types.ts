// The site header's props: the links, rows, sections, account and every slot a site may give (the parts and
// site-header.react.tsx draw them).
import type { ReactNode } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import type { ThemeChoice, ThemeSave } from "../theme-switch/theme-switch.ts";
import type { Suggest } from "./site-header.ts";

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
  // The link's accessible name, where it says more than `label` ("BioScience Writers home"); it
  // must start with the visible words (WCAG 2.5.3). Default: `label` (the letterhead: its names).
  name?: string;
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
  // A class of the site's own on the control (the button extra: in the bar and in the sheet), for
  // its look (bsw's glass Get a Quote), as `logo.className` and `panelClassName` are.
  className?: string;
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
  // The width under which the bar becomes the phone's one row with the menu sheet: 768px by
  // default; "lg" is 1024px, for a bar whose links need more room (data-collapse="lg").
  collapse?: "lg";
  // "auto": the sheet drops its 24px icon column when no row has an icon (data-sheet-icons="auto").
  // By default every row keeps the column.
  sheetIcons?: "auto";
  // The menu button's glyph, for a site whose own differs (bsw's three lines 6px apart); by
  // default the family's.
  menuIcon?: ReactNode;
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
