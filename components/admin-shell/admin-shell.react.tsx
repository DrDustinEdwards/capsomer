import { Fragment, useEffect, useId, useRef, useLayoutEffect } from "react";
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
} from "../site-header/site-header.react.tsx";
import { applyStoredTheme, syncServedTheme, THEME_PREF } from "../theme-switch/theme-switch.ts";
import {
  ACCESS_LOGOUT,
  badgeText,
  currentEntryId,
  isCollapseKey,
  jumpTarget,
} from "./admin-shell.ts";
import { FAMILY_APPS, FIRST_PAGE, OWNER, type FamilyAppId } from "./apps.tsx";
import type { AdminEntry, AdminShellProps } from "./admin-shell-types.ts";
import {
  Badge,
  COLLAPSE_D,
  countName,
  EXPAND_D,
  HeaderIcon,
  Icon,
  INBOX_D,
  mark,
  REFRESH_D,
  SEARCH_D,
  stripApps,
  Tip,
} from "./admin-shell-parts.react.tsx";

export type { LinkProps, FamilyAppId, HeaderExtra, HeaderLogo, HeaderSwitcher };
export type {
  AdminAccount,
  AdminAccountLink,
  AdminApp,
  AdminBadge,
  AdminCrumb,
  AdminEntry,
  AdminShellProps,
} from "./admin-shell-types.ts";
export { ACCESS_LOGOUT, currentEntryId, startPageTransition } from "./admin-shell.ts";
export { AdminErrorView, type AdminErrorViewProps } from "./admin-error.react.tsx";
export { FAMILY_APPS, FIRST_PAGE, OWNER };

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
  // The page you are on, from the address, for entries that do not say.
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

  // The tab says the page, then the app: "Queue · Capsid Portal".
  // An app whose routes set their own titles turns this off with documentTitle={false}.
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

  // G then a number jumps between apps (Esc hiding a shown name is the tooltip's own).
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

  // The collapse key, bound here so every app behaves the same; it presses nothing the person
  // cannot see (the menu is hidden on a phone).
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

  // The header: the logo (the app's mark and name), the extras (Search, Inbox, then the app's
  // own), the theme, and the account menu last.
  // In the letterhead the names stack as on the public pages: the agency over the site, then the app.
  // The mark is the current app's in the strip, so an app that draws its own strip mark shows it here too.
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

  // The letterhead's second row: the levels above the page, else the current entry's group, then
  // the page, else the current entry, so the row never stands empty.
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
