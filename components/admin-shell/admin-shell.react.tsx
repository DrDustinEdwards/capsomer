import { Fragment, useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";
import { Time } from "../time/time.react.tsx";
import { Dialog, DialogBody, DialogHeader } from "../dialog/dialog.react.tsx";
import { DEFAULT_PREF, readPref, writePref } from "../shell/shell.ts";
import type { LinkProps } from "../shell/shell.react.tsx";
import { ThemeSwitch } from "../theme-switch/theme-switch.react.tsx";
import { applyStoredTheme, THEME_PREF } from "../theme-switch/theme-switch.ts";
import { badgeText, jumpTarget } from "./admin-shell.ts";
import { FAMILY_APPS, FIRST_PAGE, FOXHOUND_MARKS, OWNER, type FamilyAppId } from "./apps.tsx";

export type { LinkProps, FamilyAppId };
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
  // a plain one is neutral, tone "need" is violet (it needs you), crit and warn are status colours.
  count?: number;
  countNote?: string;
  tone?: "need" | "crit" | "warn";
  group?: string;
}

// One app in the strip. The family's admin apps come from FAMILY_APPS (apps.tsx); this shape is
// for a public site's own one-app strip. `logo` is the product's mark (an svg using currentColor
// takes the tile's colour). `count` is how many things in that app need you; the app you are in
// never shows one.
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
  // The page you are on (Settings, say): the link is current, and so is More on a phone.
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

// The avatar is the owner's (OWNER, "DE") unless a name and initials are given.
export interface AdminAccount {
  name?: string;
  initials?: string;
  role?: string;
  email?: string;
  // This app: its settings, view site, shortcuts.
  appLinks?: AdminAccountLink[];
  // Elsewhere lists the other apps by itself; sign out goes last.
  onSignOut?: () => void;
  signOutDisabled?: boolean;
}

export interface AdminShellProps {
  // The family app this is. The strip lists every family app (FAMILY_APPS) in one order with this
  // one marked, and the menu's title is its name.
  app?: FamilyAppId;
  // Other apps' badges, from Capsid's one "what needs the owner" answer. The current app's is
  // never shown.
  badges?: Partial<Record<FamilyAppId, AdminBadge>>;
  // The menu's title. Default: the family app's name. Set it only outside the family.
  title?: string;
  // The strip for a site outside the family (a public site's one app). Admin areas pass `app`.
  apps?: AdminApp[];
  nav: AdminEntry[];
  // The page being shown: the tab title "<page> · <app>", and the last step of the trail.
  page?: string;
  // The levels above the page. Given, the top bar shows the trail ("Components / Shell"); a
  // top-level page has none, so the bar never repeats the page's own heading.
  trail?: AdminCrumb[];
  // The phone's bar: at most four of this app's top pages, then More. Default: the first four.
  tabs?: AdminEntry[];
  // The pages the bar has no room for. Default: the rest of `nav`.
  more?: AdminEntry[];
  navLabel?: string;
  // The strip's tools, bottom up from the account: Search, Inbox (what needs the owner, across
  // every app), Help. A tool shows only when its handler is given.
  onSearch?: () => void;
  searchShortcut?: string;
  inbox?: { count?: number; countNote?: string; href?: string; onOpen?: () => void; shortcut?: string };
  onHelp?: () => void;
  helpShortcut?: string;
  account?: AdminAccount;
  // The top bar: the trail and how fresh the data is on the left; then the page-wide controls,
  // Refresh (shown when the page can refresh) and the theme, always last. `updated` is the one
  // freshness line every app shows: "Updated 6 minutes ago", with "· refreshes itself" when
  // `auto`. `status` is anything else true of the page.
  updated?: { at: number | Date | string; auto?: boolean };
  status?: ReactNode;
  actions?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshShortcut?: string;
  // The theme switch's localStorage key; "cap-theme" by default.
  themePrefKey?: string;
  prefKey?: string;
  // G then 1 to 9 opens the app in that place (the key sequence of GitHub and Linear; Ctrl and a
  // digit belong to the browser's tabs); on by default. An app that lets single keys be switched off
  // passes that setting here.
  jumpKeys?: boolean;
  // Shown in the collapse control's name tip; the app binds the key.
  collapseKey?: string;
  renderLink?: (props: LinkProps) => ReactNode;
  // The main region's own ref and handlers (an app that scrolls to a row, say). Its id, class and
  // tab stop are the shell's.
  mainProps?: Omit<ComponentPropsWithRef<"main">, "id" | "className" | "tabIndex" | "children">;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  // Page transitions (View Transitions API): the content cross-fades between pages while the
  // strip and menu stay put. Off by default; reduced motion and browsers without the API get no
  // animation. The app wraps its page change in `startPageTransition` (a flushSync inside).
  transition?: boolean;
  children: ReactNode;
}

const Icon = ({ d, children }: { d?: string; children?: ReactNode }) => (
  <svg className="cap-admin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {d ? <path d={d} /> : children}
  </svg>
);

const COLLAPSE_D = "M3 4h18v16H3zM9 4v16M16 10l-2 2 2 2";
const EXPAND_D = "M3 4h18v16H3zM9 4v16M14 10l2 2-2 2";
const SEARCH_D = "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM21 21l-5-5";
const INBOX_D = "M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6z";
const HELP_D = "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01";
const REFRESH_D = "M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5";
const MORE_ICON = (
  <svg className="cap-admin-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="3" cy="8" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="13" cy="8" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

const plainLink = ({ children, ...props }: LinkProps) => <a {...props}>{children}</a>;

function groups(nav: AdminEntry[]): Array<{ label?: string; entries: AdminEntry[] }> {
  const out: Array<{ label?: string; entries: AdminEntry[] }> = [];
  for (const e of nav) {
    const last = out[out.length - 1];
    if (last && last.label === e.group) last.entries.push(e);
    else out.push({ label: e.group, entries: [e] });
  }
  return out;
}

const countName = (label: string, count?: number, note?: string) => (count ? `${label}, ${count}${note ? ` ${note}` : ""}` : undefined);

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
      {keys ? (
        <span className="cap-keys">
          {keys.split(" ").map((k) => (
            <kbd key={k}>{k}</kbd>
          ))}
        </span>
      ) : null}
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
    app,
    nav,
    page,
    navLabel = "Sections",
    onSearch,
    searchShortcut = "Ctrl K",
    inbox,
    onHelp,
    helpShortcut = "?",
    trail,
    updated,
    status,
    actions,
    onRefresh,
    refreshing,
    refreshShortcut,
    themePrefKey = THEME_PREF,
    prefKey = DEFAULT_PREF,
    jumpKeys = true,
    collapseKey = "[",
    renderLink = plainLink,
    mainProps,
    children,
  } = props;
  const apps = stripApps(app, props.badges, props.apps);
  const title = props.title ?? FAMILY_APPS.find((a) => a.id === app)?.label ?? apps.find((a) => a.current)?.label ?? "";
  const currentLogo = apps.find((a) => a.current)?.logo ?? null;
  const account = props.account ? { ...props.account, name: props.account.name ?? OWNER.name, initials: props.account.initials ?? OWNER.initials } : undefined;
  const root = useRef<HTMLDivElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const sheetTitle = useRef<HTMLHeadingElement>(null);
  const groupId = useId();
  const accountId = useId();
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    requestAnimationFrame(() => moreButton.current?.focus());
  }, []);
  const [own, setOwn] = useState(false);
  useEffect(() => setOwn(readPref(prefKey) === "collapsed"), [prefKey]);
  const collapsed = props.collapsed ?? own;
  const setCollapsed = useCallback(
    (next: boolean) => {
      writePref(prefKey, next ? "collapsed" : "expanded");
      setOwn(next);
      props.onCollapsedChange?.(next);
    },
    [prefKey, props.onCollapsedChange],
  );

  // The tab says the page, then the app: "Queue · Capsid Portal".
  useEffect(() => {
    if (title) document.title = page ? `${page} · ${title}` : title;
  }, [page, title]);

  // The remembered theme, in case the app's head script did not apply it before paint.
  useEffect(() => void applyStoredTheme(themePrefKey), [themePrefKey]);

  // G then a number jumps between apps (Esc hiding a shown name is the tooltip's own).
  const appsRef = useRef(apps);
  appsRef.current = apps;
  useEffect(() => {
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
  }, [jumpKeys]);

  const tabs = (props.tabs ?? nav.slice(0, 4)).slice(0, 4);
  const more = props.more ?? (props.tabs ? [] : nav.slice(4));
  const hidePanel = (e: { currentTarget: HTMLElement }) => e.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover?.();

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
            <span className="cap-admin-count" data-tone={e.tone}>
              {e.count ? badgeText(e.count) : ""}
            </span>
            <Tip text={e.label} offset={12} describe={false} />
          </>
        ),
      })}
    </Fragment>
  );

  const tab = (e: AdminEntry) => (
    <Fragment key={e.id}>
      {renderLink({
        href: e.href,
        "aria-current": e.current ? "page" : undefined,
        "aria-label": countName(e.label, e.count, e.countNote),
        children: (
          <>
            {e.icon}
            {e.label}
            {e.count ? (
              <span className="cap-admin-badge" aria-hidden="true">
                {badgeText(e.count)}
              </span>
            ) : null}
          </>
        ),
      })}
    </Fragment>
  );

  const others = apps.filter((a) => !a.current);
  const inboxName = inbox ? (countName("Inbox", inbox.count, inbox.countNote ?? "need you") ?? "Inbox") : "";
  // A link in the account panel closes the panel; a button runs its handler, then closes it.
  const accountLink = (l: AdminAccountLink) =>
    l.href ? (
      renderLink({ href: l.href, "aria-current": l.current ? "page" : undefined, onClick: () => document.getElementById(accountId)?.hidePopover?.(), children: l.label })
    ) : (
      <button type="button" onClick={(e) => (l.onClick?.(), hidePanel(e))}>
        {l.label}
      </button>
    );

  return (
    <div ref={root} className="cap-admin" data-cap="admin-shell" data-menu={collapsed ? "collapsed" : undefined} data-transition={props.transition ? "page" : undefined}>
      <a className="cap-admin-skip" href="#cap-main">
        Skip to content
      </a>
      <nav className="cap-admin-strip" aria-label="Apps and tools">
        <ul className="cap-admin-strip-group">
          <li>
            <button
              type="button"
              className="cap-admin-btn"
              data-cap-part="menu-toggle"
              aria-label={collapsed ? "Expand menu" : "Collapse menu"}
              aria-expanded={!collapsed}
              aria-controls="cap-admin-menu"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Icon d={collapsed ? EXPAND_D : COLLAPSE_D} />
              <Tip text={collapsed ? "Expand menu" : "Collapse menu"} keys={collapseKey} />
            </button>
          </li>
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
        <ul className="cap-admin-strip-group">
          {onSearch && (
            <li>
              <button type="button" className="cap-admin-btn" aria-label="Search everything" onClick={onSearch}>
                <Icon d={SEARCH_D} />
                <Tip text="Search everything" keys={searchShortcut} />
              </button>
            </li>
          )}
          {inbox && (
            <li>
              {inbox.href ? (
                renderLink({
                  href: inbox.href,
                  className: "cap-admin-btn",
                  "aria-label": inboxName,
                  children: (
                    <>
                      <Icon d={INBOX_D} />
                      <Badge count={inbox.count} />
                      <Tip text="Inbox" keys={inbox.shortcut} />
                    </>
                  ),
                })
              ) : (
                <button type="button" className="cap-admin-btn" aria-label={inboxName} onClick={inbox.onOpen}>
                  <Icon d={INBOX_D} />
                  <Badge count={inbox.count} />
                  <Tip text="Inbox" keys={inbox.shortcut} />
                </button>
              )}
            </li>
          )}
          {onHelp && (
            <li>
              <button type="button" className="cap-admin-btn" aria-label="Help and shortcuts" onClick={onHelp}>
                <Icon d={HELP_D} />
                <Tip text="Help and shortcuts" keys={helpShortcut} />
              </button>
            </li>
          )}
          {account && (
            <li>
              <button type="button" className="cap-admin-btn cap-admin-avatar" aria-label="Your account" popoverTarget={accountId}>
                <span aria-hidden="true">{account.initials}</span>
                <Tip text={account.name} />
              </button>
              <div id={accountId} popover="auto" className="cap-admin-account" aria-label="Your account" role="group">
                <div className="cap-admin-who">
                  <span className="cap-admin-btn cap-admin-avatar" aria-hidden="true">
                    {account.initials}
                  </span>
                  <div>
                    <strong>{account.name}</strong>
                    <small>{[account.role, account.email].filter(Boolean).join(" · ")}</small>
                  </div>
                </div>
                {account.appLinks && account.appLinks.length > 0 && (
                  <div className="cap-admin-account-section" role="group" aria-labelledby={`${accountId}-app`}>
                    <div className="cap-admin-group-label" id={`${accountId}-app`}>
                      This app
                    </div>
                    {account.appLinks.map((l) => (
                      <Fragment key={l.label}>{accountLink(l)}</Fragment>
                    ))}
                  </div>
                )}
                {others.length > 0 && (
                  <div className="cap-admin-account-section" role="group" aria-labelledby={`${accountId}-else`}>
                    <div className="cap-admin-group-label" id={`${accountId}-else`}>
                      Elsewhere
                    </div>
                    {others.map((a) => (
                      <a key={a.id} href={a.href}>
                        {a.label}
                      </a>
                    ))}
                  </div>
                )}
                {account.onSignOut && (
                  <>
                    <hr />
                    <button type="button" disabled={account.signOutDisabled} onClick={() => account.onSignOut?.()}>
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </li>
          )}
        </ul>
      </nav>
      <nav className="cap-admin-menu" id="cap-admin-menu" aria-label={navLabel}>
        <div className="cap-admin-title">
          {/* Collapsed, the column keeps the app's identity: its mark at the top. Open, the
              title is the name only (the marked strip tile beside it is the logo). */}
          <span className="cap-admin-title-mark" aria-hidden="true">
            {currentLogo}
          </span>
          <span className="cap-admin-title-text">{title}</span>
        </div>
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
            <strong className="cap-admin-bar-app">{title}</strong>
            {trail && trail.length > 0 ? (
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
          <div className="cap-admin-actions">
            {actions}
            {onRefresh && (
              <button type="button" className="cap-admin-btn" data-cap-part="refresh" aria-label="Refresh" aria-busy={refreshing || undefined} onClick={onRefresh}>
                <Icon d={REFRESH_D} />
                <Tip text="Refresh" keys={refreshShortcut} side="bottom" offset={6} />
              </button>
            )}
            <ThemeSwitch prefKey={themePrefKey} />
          </div>
        </div>
        {children}
      </main>
      <nav className="cap-admin-tabs" aria-label={navLabel}>
        {tabs.map(tab)}
        <button ref={moreButton} type="button" data-cap-part="more" aria-haspopup="dialog" aria-current={more.some((e) => e.current) || account?.appLinks?.some((l) => l.current) ? "true" : undefined} aria-expanded={sheetOpen} aria-controls="cap-admin-sheet" onClick={() => setSheetOpen(true)}>
          {MORE_ICON}
          More
        </button>
      </nav>
      <Dialog open={sheetOpen} onOpenChange={(o) => !o && closeSheet()} placement="bottom" id="cap-admin-sheet" className="cap-admin-sheet" aria-labelledby="cap-admin-sheet-title" initialFocus={sheetTitle}>
        <DialogHeader>
          <h2 id="cap-admin-sheet-title" className="cap-dialog-title" ref={sheetTitle} tabIndex={-1}>
            {title}: apps and more
          </h2>
        </DialogHeader>
        <DialogBody>
          <nav aria-labelledby="cap-admin-sheet-title">
            <div className="cap-admin-sheet-label">Apps</div>
            <ul className="cap-admin-sheet-list">
              {apps.map((a) => (
                <li key={a.id}>
                  {renderLink({
                    href: a.href,
                    "aria-current": a.current ? "true" : undefined,
                    onClick: closeSheet,
                    children: (
                      <>
                        <span className="cap-admin-sheet-icon cap-admin-app-mark" aria-hidden="true">{mark(a)}</span>
                        <span className="cap-admin-sheet-name">{a.label}</span>
                        {a.current ? null : a.count ? <span className="cap-admin-count" data-tone="need">{badgeText(a.count)}</span> : null}
                      </>
                    ),
                  })}
                </li>
              ))}
            </ul>
            {more.length > 0 && (
              <>
                <div className="cap-admin-sheet-label">{title}</div>
                <ul className="cap-admin-sheet-list">
                  {more.map((e) => (
                    <li key={e.id}>
                      {renderLink({
                        href: e.href,
                        "aria-current": e.current ? "page" : undefined,
                        onClick: closeSheet,
                        children: (
                          <>
                            <span className="cap-admin-sheet-icon" aria-hidden="true">{e.icon}</span>
                            <span className="cap-admin-sheet-name">{e.label}</span>
                            {e.count ? (
                              <span className="cap-admin-count" data-tone={e.tone}>
                                {`${badgeText(e.count)}${e.countNote ? ` ${e.countNote}` : ""}`}
                              </span>
                            ) : null}
                          </>
                        ),
                      })}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(onSearch || inbox || onHelp) && (
              <>
                <div className="cap-admin-sheet-label">Tools</div>
                <ul className="cap-admin-sheet-list">
                  {onSearch && (
                    <li>
                      <button type="button" onClick={() => (closeSheet(), onSearch())}>
                        <span className="cap-admin-sheet-icon" aria-hidden="true"><Icon d={SEARCH_D} /></span>
                        <span className="cap-admin-sheet-name">Search everything</span>
                      </button>
                    </li>
                  )}
                  {inbox && (
                    <li>
                      {inbox.href ? (
                        renderLink({
                          href: inbox.href,
                          onClick: closeSheet,
                          children: (
                            <>
                              <span className="cap-admin-sheet-icon" aria-hidden="true"><Icon d={INBOX_D} /></span>
                              <span className="cap-admin-sheet-name">Inbox</span>
                              {inbox.count ? <span className="cap-admin-count" data-tone="need">{`${badgeText(inbox.count)}${inbox.countNote ? ` ${inbox.countNote}` : ""}`}</span> : null}
                            </>
                          ),
                        })
                      ) : (
                        <button type="button" onClick={() => (closeSheet(), inbox.onOpen?.())}>
                          <span className="cap-admin-sheet-icon" aria-hidden="true"><Icon d={INBOX_D} /></span>
                          <span className="cap-admin-sheet-name">Inbox</span>
                          {inbox.count ? <span className="cap-admin-count" data-tone="need">{`${badgeText(inbox.count)}${inbox.countNote ? ` ${inbox.countNote}` : ""}`}</span> : null}
                        </button>
                      )}
                    </li>
                  )}
                  {onHelp && (
                    <li>
                      <button type="button" onClick={() => (closeSheet(), onHelp())}>
                        <span className="cap-admin-sheet-icon" aria-hidden="true"><Icon d={HELP_D} /></span>
                        <span className="cap-admin-sheet-name">Help and shortcuts</span>
                      </button>
                    </li>
                  )}
                </ul>
              </>
            )}
          </nav>
        </DialogBody>
        {(account?.appLinks?.length || account?.onSignOut) && (
          <nav className="cap-admin-sheet-account" aria-label="Account">
            <ul className="cap-admin-sheet-list">
              {account.appLinks?.map((l) => {
                const inner = (
                  <>
                    <span className="cap-admin-sheet-icon" aria-hidden="true" />
                    <span className="cap-admin-sheet-name">{l.label}</span>
                  </>
                );
                return (
                  <li key={l.label}>
                    {l.href ? (
                      renderLink({ href: l.href, "aria-current": l.current ? "page" : undefined, onClick: closeSheet, children: inner })
                    ) : (
                      <button type="button" onClick={() => (closeSheet(), l.onClick?.())}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
              {account.onSignOut && (
                <li>
                  <button type="button" disabled={account.signOutDisabled} onClick={() => (closeSheet(), account.onSignOut?.())}>
                    <span className="cap-admin-sheet-icon" aria-hidden="true" />
                    <span className="cap-admin-sheet-name">Sign out ({account.name})</span>
                  </button>
                </li>
              )}
            </ul>
          </nav>
        )}
      </Dialog>
    </div>
  );
}
