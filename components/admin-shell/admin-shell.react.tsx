import {
  Fragment,
  useEffect,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
  useLayoutEffect,
} from "react";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";
import { Time } from "../time/time.react.tsx";
import { DEFAULT_PREF } from "../shell/shell.ts";
import { plainLink } from "../hooks/hooks.react.tsx";
import { groups, useCollapsedPref, type LinkProps } from "../shell/shell.react.tsx";
import {
  SheetGroup,
  SiteHeader,
  SiteTabs,
  type HeaderAccount,
  type HeaderExtra,
  type HeaderLink,
  type HeaderLogo,
  type HeaderSwitcher,
  type SiteHeaderProps,
} from "../site-header/site-header.react.tsx";
import { countName as headerCountName, TipKeys } from "../site-header/site-header-parts.react.tsx";
import { applyStoredTheme, syncServedTheme, THEME_PREF } from "../theme-switch/theme-switch.ts";
import type { Suggest } from "../site-header/site-header.ts";
import {
  ACCESS_LOGOUT,
  badgeText,
  currentEntryId,
  isCollapseKey,
  jumpTarget,
} from "./admin-shell.ts";
import { FAMILY_APPS, FIRST_PAGE, OWNER, type FamilyAppId } from "./apps.tsx";

export type { LinkProps, FamilyAppId, HeaderExtra, HeaderLogo, HeaderSwitcher };
export { ACCESS_LOGOUT, currentEntryId, startPageTransition } from "./admin-shell.ts";
export { AdminErrorView, type AdminErrorViewProps } from "./admin-error.react.tsx";
export { FAMILY_APPS, FIRST_PAGE, OWNER };

export interface AdminEntry {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  // Whether this is the page you are on; leave it out and give the shell `pathname` (longest match wins).
  current?: boolean;
  // Other path prefixes ("/books") or patterns that count as this entry when the shell derives `current`.
  match?: ReadonlyArray<string | RegExp>;
  // A count beside the entry, and what it counts ("Queue, 2 blocked"). Tone "need" is violet; crit and warn are status colors.
  count?: number;
  countNote?: string;
  tone?: "need" | "crit" | "warn";
  group?: string;
}

// One app in the strip, for any app not in FAMILY_APPS (apps.tsx). `logo` may be an svg using currentColor;
// `count` is how many things in that app need you (never shown for the app you are in).
export interface AdminApp {
  id: string;
  label: string;
  href: string;
  logo?: ReactNode;
  mono?: string;
  current?: boolean;
  count?: number;
  countNote?: string;
}

export interface AdminAccountLink {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

// What another app's tile says: a badge is always a number, how many things need you; no dots.
export interface AdminBadge {
  count?: number;
  countNote?: string;
}

export interface AdminCrumb {
  label: string;
  href: string;
}

export interface AdminAccount {
  name?: string;
  initials?: string;
  avatar?: string;
  role?: string;
  email?: string;
  appLinks?: AdminAccountLink[];
  // The label over `appLinks`: "This app" by default; a dashboard names the business.
  appLabel?: string;
  onSignOut?: () => void;
  // Behind Cloudflare Access, Sign out goes to Access's own address (ACCESS_LOGOUT), so `onSignOut` is not needed.
  accessLogout?: boolean;
  // Sign out as a form post, so it works before script and sends the site's CSRF fields.
  signOutAction?: string;
  signOutFields?: Record<string, string>;
  signOutDisabled?: boolean;
}

export interface AdminShellProps {
  // "owner": the strip of family apps and a 232px menu. "user": no strip and a 288px menu, so the page starts at the same left edge.
  variant?: "owner" | "user";
  // The family app this is: the strip marks it and the header's logo is its mark and name unless `logo` is given.
  app?: FamilyAppId;
  // Other apps' badges; the current app's is never shown.
  badges?: Partial<Record<FamilyAppId, AdminBadge>>;
  title?: string;
  apps?: AdminApp[];
  nav: AdminEntry[];
  // The address you are on (useLocation().pathname): entries without `current` are marked from it.
  pathname?: string;
  page?: string;
  // Whether the shell writes the tab title; false leaves document.title to the app's routes.
  documentTitle?: boolean;
  // The levels above the page, shown as the top bar's trail; a top-level page has none.
  trail?: AdminCrumb[];
  tabs?: AdminEntry[];
  navLabel?: string;
  logo?: HeaderLogo;
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
  viewSite?: string;
  account?: AdminAccount;
  // The page bar: the trail and freshness on the left, then page-wide controls and Refresh. `updated` is the one
  // freshness line every app shows; `status` is anything else true of the page.
  updated?: { at: number | Date | string; auto?: boolean };
  status?: ReactNode;
  actions?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshShortcut?: string;
  // The theme button's localStorage key and the single key the header binds to it; leave out where the app binds its own.
  themePrefKey?: string;
  themeKey?: string;
  themeCookie?: SiteHeaderProps["themeCookie"];
  onThemeSave?: SiteHeaderProps["onThemeSave"];
  themeInitial?: SiteHeaderProps["themeInitial"];
  themeAction?: SiteHeaderProps["themeAction"];
  hydrate?: SiteHeaderProps["hydrate"];
  prefKey?: string;
  // G then 1 to 9 opens the app in that place; on by default, off with the shortcuts switch, false turns it off here.
  jumpKeys?: boolean;
  // The menu's collapse key, bound by the shell (never while typing or with single-key shortcuts off); false binds none.
  collapseKey?: string | false;
  renderLink?: (props: LinkProps) => ReactNode;
  mainProps?: Omit<ComponentPropsWithRef<"main">, "id" | "className" | "tabIndex" | "children">;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  // Page transitions (View Transitions API): content cross-fades while header, strip and menu stay put. Off by
  // default; the app wraps its page change in `startPageTransition`.
  transition?: boolean;
  children: ReactNode;
}

const Icon = ({ d }: { d: string }) => (
  <svg className="cap-admin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
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

const countName = (label: string, count?: number, note?: string) =>
  count ? headerCountName(label, count, note) : undefined;

// A control's name shown beside it on hover and keyboard focus: the shared popover's tooltip in the top layer,
// a child of its control. `describe` false leaves the description alone where the tip repeats the name.
// `offset` clears what sits beside the control (the strip's edge and badge, the menu's edge).
function Tip({
  text,
  keys,
  side = "right",
  offset = 20,
  describe = true,
}: {
  text: string;
  keys?: string;
  side?: "right" | "bottom";
  offset?: number;
  describe?: boolean;
}) {
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
    <span
      ref={tip}
      className="cap-admin-tip cap-popover"
      data-variant="tooltip"
      data-side={side}
      data-offset={offset}
      popover="manual"
      role="tooltip"
      aria-hidden="true"
    >
      <span className="cap-admin-tip-text">{text}</span>
      <TipKeys keys={keys} />
    </span>
  );
}

function stripApps(
  app: FamilyAppId | undefined,
  badges: AdminShellProps["badges"],
  apps: AdminApp[] | undefined,
): AdminApp[] {
  if (apps) return apps;
  return FAMILY_APPS.map((a) => ({
    ...badges?.[a.id],
    id: a.id,
    label: a.label,
    href: a.href,
    logo: a.logo,
    current: a.id === app,
  }));
}

const Badge = ({ count }: { count?: number }) =>
  count ? (
    <span className="cap-count cap-admin-badge" data-tone="need" aria-hidden="true">
      {badgeText(count)}
    </span>
  ) : null;

const mark = (a: AdminApp) =>
  a.logo ?? <span aria-hidden="true">{a.mono ?? a.label.slice(0, 1)}</span>;

export function AdminShell(props: AdminShellProps) {
  const {
    variant = "owner",
    app,
    pathname,
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
    themeCookie,
    onThemeSave,
    themeInitial,
    themeAction,
    hydrate,
    prefKey = DEFAULT_PREF,
    jumpKeys = true,
    collapseKey = "[",
    renderLink = plainLink,
    mainProps,
    children,
  } = props;
  const owner = variant === "owner";
  const derived = pathname === undefined ? undefined : currentEntryId(pathname, props.nav);
  const nav =
    derived === undefined
      ? props.nav
      : props.nav.map((e) => (e.current === undefined ? { ...e, current: e.id === derived } : e));
  const page =
    props.page ?? (pathname === undefined ? undefined : nav.find((e) => e.current)?.label);
  const apps = stripApps(app, props.badges, props.apps);
  const family = FAMILY_APPS.find((a) => a.id === app);
  const title = props.title ?? family?.label ?? apps.find((a) => a.current)?.label ?? "";
  const root = useRef<HTMLDivElement>(null);
  const groupId = useId();
  const [collapsed, setCollapsed] = useCollapsedPref(
    prefKey,
    props.collapsed,
    props.onCollapsedChange,
  );

  // The tab says the page, then the app; documentTitle={false} turns this off.
  useEffect(() => {
    if (documentTitle && title) document.title = page ? `${page} · ${title}` : title;
  }, [documentTitle, page, title]);

  // The remembered theme, in case the app's head script did not apply it before paint.
  // Where the server keeps the choice, its answer is copied into this browser first.
  const serverKept = Boolean(themeCookie || onThemeSave);
  useEffect(() => {
    if (serverKept) syncServedTheme(themePrefKey);
    applyStoredTheme(themePrefKey);
  }, [serverKept, themePrefKey]);

  const appsRef = useRef(apps);
  useLayoutEffect(() => {
    appsRef.current = apps;
  });
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

  // The collapse key is bound here so every app behaves the same; the menu is hidden on a phone.
  const collapsedRef = useRef(collapsed);
  useLayoutEffect(() => {
    collapsedRef.current = collapsed;
  });
  useEffect(() => {
    if (!collapseKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (!isCollapseKey(e, collapseKey)) return;
      const toggle = root.current?.querySelector<HTMLElement>("[data-cap-part='menu-toggle']");
      if (!toggle || toggle.getClientRects().length === 0) return;
      e.preventDefault();
      setCollapsed(!collapsedRef.current);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [collapseKey, setCollapsed]);

  const derivedTabs = props.tabs?.map((t) =>
    t.current === undefined ? { ...t, current: nav.find((e) => e.id === t.id)?.current } : t,
  );
  const tabs = (derivedTabs ?? nav.slice(0, 5)).slice(0, 5);

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
            <span className="cap-admin-label">{e.label}</span>
            {/* The tip before the count: collapsed, the two are the row's visible words, in the
                order its name says them ("Queue, 5"; WCAG 2.5.3). */}
            <Tip text={e.label} offset={12} describe={false} />{" "}
            <span className="cap-count cap-admin-count" data-tone={e.tone}>
              {e.count ? badgeText(e.count) : ""}
            </span>
          </>
        ),
      })}
    </Fragment>
  );

  // The header: the logo, the extras, the theme, the account menu last. In the letterhead the names stack
  // (agency over site, then app), and the mark is the current app's strip mark.
  const stacked =
    props.letterhead && family?.names
      ? {
          agency: family.standalone || family.names[0] === OWNER.name ? undefined : OWNER.name,
          label: family.names[0],
          app: family.names[1],
        }
      : { label: title };
  const logo: HeaderLogo = props.logo ?? {
    href: family?.href ?? apps.find((a) => a.current)?.href ?? "/",
    ...stacked,
    mark: apps.find((a) => a.current)?.logo ?? family?.logo,
  };
  const extras: HeaderExtra[] = [
    ...(onSearch && !props.search
      ? [
          {
            id: "search",
            label: "Search everything",
            icon: <HeaderIcon d={SEARCH_D} />,
            onClick: onSearch,
            keys: searchShortcut,
          },
        ]
      : []),
    ...(inbox
      ? [
          {
            id: "inbox",
            label: "Inbox",
            icon: <HeaderIcon d={INBOX_D} />,
            href: inbox.href,
            onClick: inbox.onOpen,
            count: inbox.count,
            countNote: inbox.countNote ?? "need you",
            keys: inbox.shortcut,
          },
        ]
      : []),
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
          ...(accountProps.appLinks?.length
            ? [{ label: accountProps.appLabel ?? "This app", links: accountProps.appLinks }]
            : []),
          ...(props.viewSite || onHelp
            ? [
                {
                  links: [
                    ...(props.viewSite ? [{ label: "View site", href: props.viewSite }] : []),
                    ...(onHelp ? [{ label: "Help and shortcuts", onClick: onHelp }] : []),
                  ],
                },
              ]
            : []),
        ],
        onSignOut: accountProps.accessLogout
          ? () => location.assign(ACCESS_LOGOUT)
          : accountProps.onSignOut,
        signOutAction: accountProps.accessLogout ? undefined : accountProps.signOutAction,
        signOutFields: accountProps.signOutFields,
        signOutDisabled: accountProps.signOutDisabled,
      }
    : undefined;

  // The letterhead's second row: the levels above the page, else the current group, then the page, so the row is never empty.
  const here = nav.find((e) => e.current);
  const heading = page ?? here?.label;
  const crumbs = [
    ...(trail?.length ? trail : here?.group ? [{ label: here.group }] : []),
    ...(heading ? [{ label: heading, current: true }] : []),
  ];
  const toSheet = (e: AdminEntry): HeaderLink => ({
    id: e.id,
    label: e.label,
    href: e.href,
    current: e.current,
    icon: e.icon,
    count: e.count,
    countNote: e.countNote,
  });

  return (
    <div
      ref={root}
      className="cap-admin"
      data-cap="admin-shell"
      data-variant={variant}
      data-standalone={family?.standalone ? "" : undefined}
      data-menu={collapsed ? "collapsed" : undefined}
      data-transition={props.transition ? "page" : undefined}
    >
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
        themeCookie={themeCookie}
        onThemeSave={onThemeSave}
        themeInitial={themeInitial}
        themeAction={themeAction}
        hydrate={hydrate}
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
                          "aria-label": a.current
                            ? undefined
                            : countName(a.label, a.count, a.countNote ?? "need you"),
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
        sheetEnd={(close) =>
          groups(nav).map((g, i) => (
            <SheetGroup
              key={g.label ?? `g${i}`}
              label={g.label ?? title}
              links={g.entries.map(toSheet)}
              renderLink={renderLink}
              onClose={close}
            />
          ))
        }
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
                  "aria-label": a.current
                    ? a.label
                    : (countName(a.label, a.count, a.countNote ?? "need you") ?? a.label),
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
          {collapseKey ? (
            <span className="cap-keys" aria-hidden="true">
              <kbd>{collapseKey}</kbd>
            </span>
          ) : null}
          <Tip
            text={collapsed ? "Expand menu" : "Collapse menu"}
            keys={collapseKey || undefined}
            offset={12}
            describe={false}
          />
        </button>
        {groups(nav).map((g, i) =>
          g.label ? (
            <div
              key={`g${i}`}
              className="cap-admin-group"
              role="group"
              aria-labelledby={`${groupId}-${i}`}
            >
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
                <button
                  type="button"
                  className="cap-admin-btn"
                  data-cap-part="refresh"
                  aria-label="Refresh"
                  aria-busy={refreshing || undefined}
                  onClick={onRefresh}
                >
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
