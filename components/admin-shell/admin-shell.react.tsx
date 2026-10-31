import { Fragment, useEffect, useId, useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";
import { Time } from "../time/time.react.tsx";
import { DEFAULT_PREF } from "../shell/shell.ts";
import { groups, plainLink, useCollapsedPref, type LinkProps } from "../shell/shell.react.tsx";
import { SheetGroup, SiteHeader, SiteTabs, type HeaderAccount, type HeaderExtra, type HeaderLink, type HeaderLogo, type HeaderSwitcher } from "../site-header/site-header.react.tsx";
import { countName as headerCountName, TipKeys } from "../site-header/site-header-parts.react.tsx";
import { applyStoredTheme, THEME_PREF } from "../theme-switch/theme-switch.ts";
import type { Suggest } from "../site-header/site-header.ts";
import { badgeText, jumpTarget } from "./admin-shell.ts";
import { FAMILY_APPS, FIRST_PAGE, FOXHOUND_MARKS, OWNER, type FamilyAppId } from "./apps.tsx";

export type { LinkProps, FamilyAppId, HeaderExtra, HeaderLogo, HeaderSwitcher };
export { startPageTransition } from "./admin-shell.ts";
export { FAMILY_APPS, FIRST_PAGE, FOXHOUND_MARKS, OWNER };

// One of the current app's pages. `group` puts consecutive entries under one label.
export interface AdminEntry {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  current?: boolean;
  // A count beside the entry, and what it counts: "Queue, 2 blocked". Every count is one bubble;
  // a plain one is neutral, tone "need" is violet (it needs you), crit and warn are status colors.
  count?: number;
  countNote?: string;
  tone?: "need" | "crit" | "warn";
  group?: string;
}

// One app in the strip. The family's admin apps come from FAMILY_APPS (apps.tsx); this shape is
// for a strip outside the family. `logo` is the product's mark (an svg using currentColor takes
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
  inbox?: { count?: number; countNote?: string; href?: string; onOpen?: () => void; shortcut?: string };
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
  prefKey?: string;
  // G then 1 to 9 opens the app in that place (the key sequence of GitHub and Linear; Ctrl and a
  // digit belong to the browser's tabs); on by default, and off with the shortcuts switch. false
  // turns it off for this app alone.
  jumpKeys?: boolean;
  // Shown on the collapse control and in its name tip; the app binds the key.
  collapseKey?: string;
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

const Icon = ({ d }: { d: string }) => (
  <svg className="cap-admin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
// The header's glyphs are the 24-box, 1.6-stroke family the header draws at 18px.
const HeaderIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);

const COLLAPSE_D = "M3 4h18v16H3zM9 4v16M16 10l-2 2 2 2";
const EXPAND_D = "M3 4h18v16H3zM9 4v16M14 10l2 2-2 2";
const SEARCH_D = "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM21 21l-5-5";
const INBOX_D = "M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6z";
const REFRESH_D = "M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5";

const countName = (label: string, count?: number, note?: string) => (count ? headerCountName(label, count, note) : undefined);


// A control's name, shown beside it on hover and keyboard focus: Capsomer's one tooltip (the
// shared popover's tooltip variant, in the top layer, so it is above every panel, tile and
// badge). It is a child of its control and attaches to it; keys are key caps ("G", "2").
// `describe` false leaves the control's description alone, where the tip repeats its name.
// `offset` clears what sits beside the control: a strip tip starts past the strip's edge (and so
// past the control's own badge), a menu tip past the menu's.
function Tip({ text, keys, side = "right", offset = 20, describe = true }: { text: string; keys?: string; side?: "right" | "bottom"; offset?: number; describe?: boolean }) {
  const tip = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = tip.current;
    const trigger = el?.parentElement;
    if (!el || !trigger) return;
    const detach = attachTip(trigger, el);
    if (!describe) trigger.removeAttribute("aria-describedby");
    // A control that is used (a click or Enter) has done what its name said: the name goes, so
    // it does not sit over the panel or page the control opened.
    const used = () => hideTip(trigger);
    trigger.addEventListener("click", used);
    return () => {
      trigger.removeEventListener("click", used);
      detach();
    };
  }, [describe]);
  return (
    <span ref={tip} className="cap-admin-tip cap-popover" data-variant="tooltip" data-side={side} data-offset={offset} popover="manual" role="tooltip" aria-hidden="true">
      <span className="cap-admin-tip-text">{text}</span>
      <TipKeys keys={keys} />
    </span>
  );
}

// The strip: the family's apps in their one order, this one marked, others with their badges.
function stripApps(app: FamilyAppId | undefined, badges: AdminShellProps["badges"], apps: AdminApp[] | undefined): AdminApp[] {
  if (apps) return apps;
  return FAMILY_APPS.map((a) => ({ ...badges?.[a.id], id: a.id, label: a.label, href: a.href, logo: a.logo, current: a.id === app }));
}

const Badge = ({ count }: { count?: number }) =>
  count ? (
    <span className="cap-admin-badge" aria-hidden="true">
      {badgeText(count)}
    </span>
  ) : null;

const mark = (a: AdminApp) => a.logo ?? <span aria-hidden="true">{a.mono ?? a.label.slice(0, 1)}</span>;

export function AdminShell(props: AdminShellProps) {
  const {
    variant = "owner",
    app,
    nav,
    page,
    documentTitle = true,
    navLabel = "Sections",
    onSearch,
    searchShortcut = "Ctrl K",
    inbox,
    onHelp,
    trail,
    updated,
    status,
    actions,
    onRefresh,
    refreshing,
    refreshShortcut,
    themePrefKey = THEME_PREF,
    themeKey,
    prefKey = DEFAULT_PREF,
    jumpKeys = true,
    collapseKey = "[",
    renderLink = plainLink,
    mainProps,
    children,
  } = props;
  const owner = variant === "owner";
  const apps = stripApps(app, props.badges, props.apps);
  const family = FAMILY_APPS.find((a) => a.id === app);
  const title = props.title ?? family?.label ?? apps.find((a) => a.current)?.label ?? "";
  const root = useRef<HTMLDivElement>(null);
  const groupId = useId();
  const [collapsed, setCollapsed] = useCollapsedPref(prefKey, props.collapsed, props.onCollapsedChange);

  // The tab says the page, then the app: "Queue · Capsid Portal".
  // An app whose routes set their own titles turns this off with documentTitle={false}.
  useEffect(() => {
    if (documentTitle && title) document.title = page ? `${page} · ${title}` : title;
  }, [documentTitle, page, title]);

  // The remembered theme, in case the app's head script did not apply it before paint.
  useEffect(() => void applyStoredTheme(themePrefKey), [themePrefKey]);

  // G then a number jumps between apps (Esc hiding a shown name is the tooltip's own).
  const appsRef = useRef(apps);
  appsRef.current = apps;
  useEffect(() => {
    if (!owner) return;
    const armed = { at: 0 };
    const onKey = (e: KeyboardEvent) => {
      const to = jumpKeys ? jumpTarget(armed, e, appsRef.current) : null;
      if (to) {
        e.preventDefault();
        location.assign(to);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [jumpKeys, owner]);

  const tabs = (props.tabs ?? nav.slice(0, 5)).slice(0, 5);

  const item = (e: AdminEntry) => (
    <Fragment key={e.id}>
      {renderLink({
        href: e.href,
        "aria-current": e.current ? "page" : undefined,
        "aria-label": countName(e.label, e.count, e.countNote),
        children: (
          <>
            {e.icon ?? (
              <span className="cap-admin-letter" aria-hidden="true">
                {e.label.slice(0, 1)}
              </span>
            )}
            <span className="cap-admin-label">{e.label}</span>{" "}
            <span className="cap-admin-count" data-tone={e.tone}>
              {e.count ? badgeText(e.count) : ""}
            </span>
            <Tip text={e.label} offset={12} describe={false} />
          </>
        ),
      })}
    </Fragment>
  );

  // The header: the logo (the app's mark and name), the extras (Search, Inbox, then the app's
  // own), the theme, and the account menu last.
  // In the letterhead the names stack as on the public pages: the agency over the site, then the app.
  // The mark is the current app's in the strip, so an app that draws its own strip mark shows it here too.
  const stacked = props.letterhead && family?.names ? { agency: family.standalone || family.names[0] === OWNER.name ? undefined : OWNER.name, label: family.names[0], app: family.names[1] } : { label: title };
  const logo: HeaderLogo = props.logo ?? { href: family?.href ?? apps.find((a) => a.current)?.href ?? "/", ...stacked, mark: apps.find((a) => a.current)?.logo ?? family?.logo };
  const extras: HeaderExtra[] = [
    ...(onSearch && !props.search ? [{ id: "search", label: "Search everything", icon: <HeaderIcon d={SEARCH_D} />, onClick: onSearch, keys: searchShortcut }] : []),
    ...(inbox ? [{ id: "inbox", label: "Inbox", icon: <HeaderIcon d={INBOX_D} />, href: inbox.href, onClick: inbox.onOpen, count: inbox.count, countNote: inbox.countNote ?? "need you", keys: inbox.shortcut }] : []),
    ...(props.extras ?? []),
  ];
  const accountProps = props.account;
  const account: HeaderAccount | undefined = accountProps
    ? {
        name: accountProps.name ?? OWNER.name,
        initials: accountProps.initials ?? OWNER.initials,
        avatar: accountProps.avatar,
        detail: [accountProps.role, accountProps.email].filter(Boolean).join(" · ") || undefined,
        groups: [
          ...(accountProps.appLinks?.length ? [{ label: accountProps.appLabel ?? "This app", links: accountProps.appLinks }] : []),
          ...(props.viewSite || onHelp ? [{ links: [...(props.viewSite ? [{ label: "View site", href: props.viewSite }] : []), ...(onHelp ? [{ label: "Help and shortcuts", onClick: onHelp }] : [])] }] : []),
        ],
        onSignOut: accountProps.onSignOut,
        signOutDisabled: accountProps.signOutDisabled,
      }
    : undefined;

  // The letterhead's second row: the levels above the page, else the current entry's group, then
  // the page, else the current entry, so the row never stands empty.
  const here = nav.find((e) => e.current);
  const heading = page ?? here?.label;
  const crumbs = [
    ...(trail?.length ? trail : here?.group ? [{ label: here.group }] : []),
    ...(heading ? [{ label: heading, current: true }] : []),
  ];
  const toSheet = (e: AdminEntry): HeaderLink => ({ id: e.id, label: e.label, href: e.href, current: e.current, icon: e.icon, count: e.count, countNote: e.countNote });

  return (
    <div ref={root} className="cap-admin" data-cap="admin-shell" data-variant={variant} data-standalone={family?.standalone ? "" : undefined} data-menu={collapsed ? "collapsed" : undefined} data-transition={props.transition ? "page" : undefined}>
      <SiteHeader
        logo={logo}
        variant={props.letterhead ? "letterhead" : undefined}
        search={props.search}
        trail={props.letterhead ? { crumbs: crumbs, viewSite: props.viewSite } : undefined}
        band={props.band}
        translucent={props.translucent}
        switchers={props.switchers}
        extras={extras}
        themePrefKey={themePrefKey}
        themeKey={themeKey}
        account={account}
        skipTo="#cap-main"
        renderLink={renderLink}
        sheetTitle={`${title} menu`}
        sheetStart={
          owner
            ? (close) => (
                <>
                  <div className="cap-site-header-sheet-label">Apps</div>
                  <ul className="cap-site-header-sheet-list">
                    {apps.map((a) => (
                      <li key={a.id}>
                        {renderLink({
                          href: a.href,
                          "aria-current": a.current ? "true" : undefined,
                          "aria-label": a.current ? undefined : countName(a.label, a.count, a.countNote ?? "need you"),
                          onClick: close,
                          children: (
                            <>
                              <span className="cap-site-header-sheet-icon" aria-hidden="true">
                                {mark(a)}
                              </span>
                              <span className="cap-site-header-sheet-name">{a.label}</span>
                              {a.current || !a.count ? null : " "}
                              {a.current || !a.count ? null : (
                                <span className="cap-site-header-count" aria-hidden="true">
                                  {badgeText(a.count)}
                                </span>
                              )}
                            </>
                          ),
                        })}
                      </li>
                    ))}
                  </ul>
                </>
              )
            : undefined
        }
        sheetEnd={(close) => groups(nav).map((g, i) => <SheetGroup key={g.label ?? `g${i}`} label={g.label ?? title} links={g.entries.map(toSheet)} renderLink={renderLink} onClose={close} />)}
      />
      {owner ? (
        <nav className="cap-admin-strip" aria-label="Apps">
          <ul className="cap-admin-strip-group">
            {apps.map((a, i) => (
              <li key={a.id}>
                {(a.current ? renderLink : plainLink)({
                  href: a.href,
                  className: "cap-admin-tile",
                  "aria-current": a.current ? "true" : undefined,
                  "aria-label": a.current ? a.label : (countName(a.label, a.count, a.countNote ?? "need you") ?? a.label),
                  children: (
                    <>
                      {mark(a)}
                      {a.current ? null : <Badge count={a.count} />}
                      <Tip text={a.label} keys={i < 9 && jumpKeys ? `G ${i + 1}` : undefined} />
                    </>
                  ),
                })}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <nav className="cap-admin-menu" id="cap-admin-menu" aria-label={navLabel}>
        {/* The collapse control is the menu's first row, in the same place open and collapsed and
            in both kinds of shell, with its key; collapsed, its words hide and its tip names it. */}
        <button
          type="button"
          className="cap-admin-collapse"
          data-cap-part="menu-toggle"
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          aria-expanded={!collapsed}
          aria-controls="cap-admin-menu"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Icon d={collapsed ? EXPAND_D : COLLAPSE_D} />
          <span className="cap-admin-label">{collapsed ? "Expand menu" : "Collapse menu"}</span>
          <span className="cap-keys" aria-hidden="true">
            <kbd>{collapseKey}</kbd>
          </span>
          <Tip text={collapsed ? "Expand menu" : "Collapse menu"} keys={collapseKey} offset={12} describe={false} />
        </button>
        {groups(nav).map((g, i) =>
          g.label ? (
            <div key={`g${i}`} className="cap-admin-group" role="group" aria-labelledby={`${groupId}-${i}`}>
              <div className="cap-admin-group-label" id={`${groupId}-${i}`}>
                {g.label}
              </div>
              {g.entries.map(item)}
            </div>
          ) : (
            g.entries.map(item)
          ),
        )}
      </nav>
      <main {...mainProps} className="cap-admin-main" id="cap-main" tabIndex={-1}>
        <div className="cap-admin-bar">
          <div className="cap-admin-bar-text">
            {trail && trail.length > 0 && !props.letterhead ? (
              <nav className="cap-admin-trail" aria-label="Breadcrumb">
                <ol>
                  {trail.map((c) => (
                    <li key={c.href}>{renderLink({ href: c.href, children: c.label })}</li>
                  ))}
                  {page ? (
                    <li>
                      <span aria-current="page">{page}</span>
                    </li>
                  ) : null}
                </ol>
              </nav>
            ) : null}
            {updated ? (
              <span className="cap-admin-fresh">
                Updated <Time at={updated.at} />
                {updated.auto ? " · refreshes itself" : null}
              </span>
            ) : null}
            {status ? <div className="cap-admin-bar-status">{status}</div> : null}
          </div>
          {actions || onRefresh ? (
            <div className="cap-admin-actions">
              {actions}
              {onRefresh && (
                <button type="button" className="cap-admin-btn" data-cap-part="refresh" aria-label="Refresh" aria-busy={refreshing || undefined} onClick={onRefresh}>
                  <Icon d={REFRESH_D} />
                  <Tip text="Refresh" keys={refreshShortcut} side="bottom" offset={6} />
                </button>
              )}
            </div>
          ) : null}
        </div>
        {children}
      </main>
      <SiteTabs tabs={tabs.map(toSheet)} label={navLabel} renderLink={renderLink} />
    </div>
  );
}
