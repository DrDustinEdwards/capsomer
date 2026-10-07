import { Fragment, useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog.react.tsx";
import { DEFAULT_PREF, readPref, writePref } from "../shell/shell.ts";
import type { LinkProps } from "../shell/shell.react.tsx";
import { hideShownNames, jumpTarget, showNamesAgain } from "./admin-shell.ts";

export type { LinkProps };

// One of the current app's pages. `group` puts consecutive entries under one label.
export interface AdminEntry {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  current?: boolean;
  // A count beside the entry, and what it counts: "Queue, 2 blocked". A plain number counts;
  // tone "need" makes it a violet pill (it needs you); crit and warn are status colours.
  count?: number;
  countNote?: string;
  tone?: "need" | "crit" | "warn";
  group?: string;
}

// One admin area in the strip. `logo` is the product's mark (an svg using currentColor takes the
// tile's colour); with none the tile shows `mono`, the name's first letter. `count` or `dot`
// means this app needs you; the app you are in never shows one.
export interface AdminApp {
  id: string;
  label: string;
  href: string;
  logo?: ReactNode;
  mono?: string;
  current?: boolean;
  count?: number;
  dot?: boolean;
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

export interface AdminAccount {
  name: string;
  initials: string;
  role?: string;
  email?: string;
  // This app: its settings, view site, shortcuts.
  appLinks?: AdminAccountLink[];
  // Elsewhere lists the other apps by itself; sign out goes last.
  onSignOut?: () => void;
  signOutDisabled?: boolean;
}

export interface AdminShellProps {
  // The current app's name, a plain title above its menu.
  title: string;
  mark?: ReactNode;
  apps: AdminApp[];
  nav: AdminEntry[];
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
  // The page's own thin bar: how fresh the data is, then its page-wide controls.
  status?: ReactNode;
  actions?: ReactNode;
  prefKey?: string;
  // Ctrl or Cmd with 1 to 9 opens the app in that place; on by default.
  jumpKeys?: boolean;
  // Shown in the collapse control's name tip; the app binds the key.
  collapseKey?: string;
  renderLink?: (props: LinkProps) => ReactNode;
  // The main region's own ref and handlers (an app that scrolls to a row, say). Its id, class and
  // tab stop are the shell's.
  mainProps?: Omit<ComponentPropsWithRef<"main">, "id" | "className" | "tabIndex" | "children">;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
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

// A strip control's name, shown beside it on hover and keyboard focus, with its key.
const Tip = ({ text, keys }: { text: string; keys?: string }) => (
  <span className="cap-admin-tip" aria-hidden="true">
    <span className="cap-admin-tip-text">{text}</span>
    {keys ? <kbd>{keys}</kbd> : null}
  </span>
);

const Badge = ({ count, dot }: { count?: number; dot?: boolean }) =>
  count ? (
    <span className="cap-admin-badge" aria-hidden="true">
      {count}
    </span>
  ) : dot ? (
    <span className="cap-admin-badge" data-dot="" aria-hidden="true" />
  ) : null;

const mark = (a: AdminApp) => a.logo ?? <span aria-hidden="true">{a.mono ?? a.label.slice(0, 1)}</span>;

export function AdminShell(props: AdminShellProps) {
  const {
    title,
    mark: titleMark,
    apps,
    nav,
    navLabel = "Sections",
    onSearch,
    searchShortcut = "Ctrl K",
    inbox,
    onHelp,
    helpShortcut = "?",
    account,
    status,
    actions,
    prefKey = DEFAULT_PREF,
    jumpKeys = true,
    collapseKey = "[",
    renderLink = plainLink,
    mainProps,
    children,
  } = props;
  const root = useRef<HTMLDivElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
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

  // Ctrl or Cmd and a digit jump between apps; Esc hides a shown name (WCAG 1.4.13).
  const appsRef = useRef(apps);
  appsRef.current = apps;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && root.current) return hideShownNames(root.current);
      const to = jumpKeys ? jumpTarget(e, appsRef.current) : null;
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
            {e.icon ?? <span aria-hidden="true" />}
            <span>{e.label}</span>
            <span className="cap-admin-count" data-tone={e.tone}>
              {e.count ? e.count : ""}
            </span>
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
                {e.count}
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
    <div ref={root} className="cap-admin" data-cap="admin-shell" data-menu={collapsed ? "collapsed" : undefined} onMouseOut={showNamesAgain} onBlur={showNamesAgain}>
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
                "aria-label": a.current ? a.label : (countName(a.label, a.count, a.countNote ?? "need you") ?? (a.dot ? `${a.label}, ${a.countNote ?? "needs you"}` : a.label)),
                children: (
                  <>
                    {mark(a)}
                    {a.current ? null : <Badge count={a.count} dot={a.dot} />}
                    <Tip text={a.label} keys={i < 9 && jumpKeys ? `Ctrl ${i + 1}` : undefined} />
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
      <nav className="cap-admin-menu" id="cap-admin-menu" aria-label={navLabel} hidden={collapsed || undefined}>
        <div className="cap-admin-title">
          {titleMark}
          {title}
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
        {(status || actions) && (
          <div className="cap-admin-bar">
            <div>{status}</div>
            <div className="cap-admin-actions">{actions}</div>
          </div>
        )}
        {children}
      </main>
      <nav className="cap-admin-tabs" aria-label={navLabel}>
        {tabs.map(tab)}
        <button ref={moreButton} type="button" data-cap-part="more" aria-haspopup="dialog" aria-current={more.some((e) => e.current) || account?.appLinks?.some((l) => l.current) ? "true" : undefined} aria-expanded={sheetOpen} aria-controls="cap-admin-sheet" onClick={() => setSheetOpen(true)}>
          {MORE_ICON}
          More
        </button>
      </nav>
      <Dialog open={sheetOpen} onOpenChange={(o) => !o && closeSheet()} placement="bottom" id="cap-admin-sheet" className="cap-admin-sheet" aria-labelledby="cap-admin-sheet-title">
        <DialogHeader>
          <DialogTitle id="cap-admin-sheet-title">{title}: apps and more</DialogTitle>
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
                        <span className="cap-admin-app-mark">{mark(a)}</span>
                        <span className="cap-admin-sheet-name">{a.label}</span>
                        {a.current ? null : a.count ? <span className="cap-admin-count" data-tone="need">{a.count}</span> : null}
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
                            {e.icon}
                            <span className="cap-admin-sheet-name">{e.label}</span>
                            {e.count ? (
                              <span className="cap-admin-count" data-tone={e.tone}>
                                {`${e.count}${e.countNote ? ` ${e.countNote}` : ""}`}
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
            {(onSearch || inbox || onHelp || account) && (
              <>
                <div className="cap-admin-sheet-label">Tools</div>
                <ul className="cap-admin-sheet-list">
                  {onSearch && (
                    <li>
                      <button type="button" onClick={() => (closeSheet(), onSearch())}>
                        <Icon d={SEARCH_D} />
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
                              <Icon d={INBOX_D} />
                              <span className="cap-admin-sheet-name">Inbox</span>
                              {inbox.count ? <span className="cap-admin-count" data-tone="need">{`${inbox.count}${inbox.countNote ? ` ${inbox.countNote}` : ""}`}</span> : null}
                            </>
                          ),
                        })
                      ) : (
                        <button type="button" onClick={() => (closeSheet(), inbox.onOpen?.())}>
                          <Icon d={INBOX_D} />
                          <span className="cap-admin-sheet-name">Inbox</span>
                          {inbox.count ? <span className="cap-admin-count" data-tone="need">{`${inbox.count}${inbox.countNote ? ` ${inbox.countNote}` : ""}`}</span> : null}
                        </button>
                      )}
                    </li>
                  )}
                  {onHelp && (
                    <li>
                      <button type="button" onClick={() => (closeSheet(), onHelp())}>
                        <Icon d={HELP_D} />
                        <span className="cap-admin-sheet-name">Help and shortcuts</span>
                      </button>
                    </li>
                  )}
                  {account?.appLinks?.map((l) => (
                    <li key={l.label}>{l.href ? renderLink({ href: l.href, "aria-current": l.current ? "page" : undefined, onClick: closeSheet, children: l.label }) : <button type="button" onClick={() => (closeSheet(), l.onClick?.())}>{l.label}</button>}</li>
                  ))}
                  {account?.onSignOut && (
                    <li>
                      <button type="button" disabled={account.signOutDisabled} onClick={() => (closeSheet(), account.onSignOut?.())}>
                        Sign out ({account.name})
                      </button>
                    </li>
                  )}
                </ul>
              </>
            )}
          </nav>
        </DialogBody>
      </Dialog>
    </div>
  );
}
