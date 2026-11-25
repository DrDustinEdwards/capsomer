import type { ComponentPropsWithRef, ReactNode } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import type {
  HeaderExtra,
  HeaderLogo,
  HeaderSwitcher,
  SiteHeaderProps,
} from "../site-header/site-header.react.tsx";
import type { Suggest } from "../site-header/site-header.ts";
import type { FamilyAppId } from "./apps.tsx";

// One of the current app's pages. `group` puts consecutive entries under one label.
export interface AdminEntry {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  // Whether this is the page you are on. Leave it out and give the shell `pathname`: the shell
  // marks the entry the address is in (currentEntryId), the longest match winning.
  current?: boolean;
  // What else counts as this entry when the shell derives `current`: path prefixes ("/books")
  // or patterns (/^\/drafts\/\d+/). Default: the entry's own `href`.
  match?: ReadonlyArray<string | RegExp>;
  // A count beside the entry, and what it counts: "Queue, 2 blocked". Every count is one bubble;
  // a plain one is neutral, tone "need" is violet (it needs you), crit and warn are status colors.
  count?: number;
  countNote?: string;
  tone?: "need" | "crit" | "warn";
  group?: string;
}

// One app in the strip. The family's apps come from FAMILY_APPS (apps.tsx); this is for any other. `logo` is the product's mark (an svg using currentColor takes
// the tile's color). `count` is how many things in that app need you; the app you are in never
// shows one.
export interface AdminApp {
  id: string;
  label: string;
  href: string;
  logo?: ReactNode;
  mono?: string;
  current?: boolean;
  count?: number;
  // What the badge means, for the accessible name: "2 AI drafts waiting". Default "need you".
  countNote?: string;
}

export interface AdminAccountLink {
  label: string;
  href?: string;
  onClick?: () => void;
  // The page you are on (Settings, say).
  current?: boolean;
}

// What another app's tile says. One rule for every tile: a badge is always a number, how many
// things in that app need you (a state with nothing to count, one failing check, is 1). No dots.
export interface AdminBadge {
  count?: number;
  countNote?: string;
}

// A level of the top bar's trail, before the page itself: "Components" above "Shell".
export interface AdminCrumb {
  label: string;
  href: string;
}

// The avatar is the owner's (OWNER, "DE") unless a name and initials are given. Its menu, in the
// header's top right: who you are; this app's rows (`appLinks`); View site and Help; Sign out last.
export interface AdminAccount {
  name?: string;
  initials?: string;
  // A picture of the person, over the initials (the header's `account.avatar`).
  avatar?: string;
  role?: string;
  email?: string;
  appLinks?: AdminAccountLink[];
  // The label over `appLinks`: "This app" by default; a dashboard names the business ("Acme
  // Supply Co."), so its settings sit under its name.
  appLabel?: string;
  onSignOut?: () => void;
  // Behind Cloudflare Access: Sign out sends the browser to Access's own sign-out address
  // (ACCESS_LOGOUT), which ends the Access session; `onSignOut` is then not needed.
  accessLogout?: boolean;
  // Sign out as a form post (the header's `account.signOutAction` and `signOutFields`), so it works
  // before script and sends the site's CSRF fields.
  signOutAction?: string;
  signOutFields?: Record<string, string>;
  signOutDisabled?: boolean;
}

export interface AdminShellProps {
  // "owner" (your admin): the strip of the family's apps, then a 232px menu. "user" (a customer's
  // own dashboard): no strip and a 288px menu, so the page starts at the same left edge in both.
  variant?: "owner" | "user";
  // The family app this is. The strip lists every family app (FAMILY_APPS) in one order with this
  // one marked, and the header's logo is its mark and name unless `logo` is given.
  app?: FamilyAppId;
  // Other apps' badges, from Capsid's one "what needs the owner" answer. The current app's is
  // never shown.
  badges?: Partial<Record<FamilyAppId, AdminBadge>>;
  // The app's name, for the tab title and the sheet. Default: the family app's. Set it only
  // outside the family.
  title?: string;
  // The strip for a site outside the family. Admin areas pass `app`.
  apps?: AdminApp[];
  nav: AdminEntry[];
  // The address you are on (React Router's useLocation().pathname). Given, every entry without its
  // own `current` is marked from it, and `page` defaults to the current entry's label.
  pathname?: string;
  // The page being shown: the tab title "<page> · <app>", and the last step of the trail.
  page?: string;
  // Whether the shell writes the tab title from `page` and `title`. Default true. False leaves
  // document.title to the app's routes; `title` still names the logo, the sheet and its groups.
  documentTitle?: boolean;
  // The levels above the page. Given, the top bar shows the trail ("Components / Shell"); a
  // top-level page has none, so the bar never repeats the page's own heading.
  trail?: AdminCrumb[];
  // The phone's bottom bar: up to five of this app's top pages, no More. Default: the first five.
  tabs?: AdminEntry[];
  navLabel?: string;
  // The header (components/site-header): the site's logo, its band, a switcher (a dashboard's
  // business and product), and its extras. Search and Inbox are the header's first two extras;
  // Help is a row of the account menu.
  logo?: HeaderLogo;
  // The family letterhead (components/site-header): the band as tall as the site's public pages,
  // its second row holding where you are and View site; `search` is the header's search icon and field.
  letterhead?: boolean;
  search?: { action: string; label: string; name?: string; suggest?: Suggest };
  band?: "dark";
  translucent?: boolean;
  switchers?: HeaderSwitcher[];
  extras?: HeaderExtra[];
  onSearch?: () => void;
  searchShortcut?: string;
  inbox?: {
    count?: number;
    countNote?: string;
    href?: string;
    onOpen?: () => void;
    shortcut?: string;
  };
  onHelp?: () => void;
  // The account menu's View site row.
  viewSite?: string;
  account?: AdminAccount;
  // The page bar: the trail and how fresh the data is on the left; then the page-wide controls
  // and Refresh (shown when the page can refresh), last. `updated` is the one freshness line every
  // app shows: "Updated 6 minutes ago", with "· refreshes itself" when `auto`. `status` is anything
  // else true of the page.
  updated?: { at: number | Date | string; auto?: boolean };
  status?: ReactNode;
  actions?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshShortcut?: string;
  // The theme button's localStorage key ("cap-theme" by default), and the single key the app lets
  // the header bind to it ("T"); leave it out where the app binds its own.
  themePrefKey?: string;
  themeKey?: string;
  // Passed to the site header: where the theme choice is kept besides this browser (a cookie, the
  // account), the server's answer, the no-script theme form, and whether the header hydrates.
  themeCookie?: SiteHeaderProps["themeCookie"];
  onThemeSave?: SiteHeaderProps["onThemeSave"];
  themeInitial?: SiteHeaderProps["themeInitial"];
  themeAction?: SiteHeaderProps["themeAction"];
  hydrate?: SiteHeaderProps["hydrate"];
  prefKey?: string;
  // G then 1 to 9 opens the app in that place (the key sequence of GitHub and Linear; Ctrl and a
  // digit belong to the browser's tabs); on by default, and off with the shortcuts switch. false
  // turns it off for this app alone.
  jumpKeys?: boolean;
  // The menu's collapse key, shown on the collapse control and in its tip. The shell binds it
  // (never while a person types, or with single-key shortcuts off); false shows no key and binds none.
  collapseKey?: string | false;
  renderLink?: (props: LinkProps) => ReactNode;
  // The main region's own ref and handlers (an app that scrolls to a row, say). Its id, class and
  // tab stop are the shell's.
  mainProps?: Omit<ComponentPropsWithRef<"main">, "id" | "className" | "tabIndex" | "children">;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  // Page transitions (View Transitions API): the content cross-fades between pages while the
  // header, strip and menu stay put. Off by default; reduced motion and browsers without the API
  // get no animation. The app wraps its page change in `startPageTransition` (a flushSync inside).
  transition?: boolean;
  children: ReactNode;
}
