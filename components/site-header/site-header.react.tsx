import { Fragment, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogBody, DialogHeader } from "../dialog/dialog.react.tsx";
import type { LinkProps } from "../shell/shell.react.tsx";
import { ThemeButton } from "../theme-switch/theme-switch.react.tsx";
import { THEME_PREF, toggleTheme } from "../theme-switch/theme-switch.ts";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";
import { badgeText, wirePanel } from "./site-header.ts";

export type { LinkProps };

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

// A group of links under a quiet label, in a panel or the sheet.
export interface HeaderGroup {
  label?: string;
  links: HeaderLink[];
}

// The site's logo: its mark (an svg at most 24px tall) and its name, which is also the link's name.
// `wordmark` is what is drawn beside the mark; leave it out to show `label`.
export interface HeaderLogo {
  href: string;
  label: string;
  mark?: ReactNode;
  wordmark?: ReactNode;
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
}

// A section link. With `groups` or a `panel` it is a disclosure button opening a panel; else a
// link. Its panel's contents and layout are the site's.
export interface HeaderSection {
  id: string;
  label: string;
  href?: string;
  current?: boolean;
  groups?: HeaderGroup[];
  panel?: ReactNode;
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
}

export interface HeaderAccountLink {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

// The account menu, the same shape everywhere: who you are; the site's own rows in groups (a
// business's settings under its name, "Admin" for an admin, "View site" and "Help" in an admin);
// Sign out last. A site that draws its own panel (Foxing) passes `panel` and the same `groups` for
// the sheet.
export interface HeaderAccount {
  name: string;
  initials: string;
  detail?: string;
  groups?: Array<{ label?: string; links: HeaderAccountLink[] }>;
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
  // Where the section links sit: after the switcher (left), centred in the header (center), or on
  // the right before the extras, after a thin divider (right).
  links?: "left" | "center" | "right";
  extras?: HeaderExtra[];
  // The theme button; on by default. `themeKey` is the single key the header binds to switch it
  // ("T"), shown in its tip; leave it out where the site does not bind single keys.
  theme?: boolean;
  themePrefKey?: string;
  themeKey?: string;
  // Signed in: the avatar menu. Signed out: Sign in holds its place, last.
  account?: HeaderAccount;
  signIn?: { href: string; label?: string };
  // The band: dark in both themes, and translucent over the page.
  band?: "dark";
  translucent?: boolean;
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
  renderLink?: (props: LinkProps) => ReactNode;
}

const plainLink = ({ children, ...props }: LinkProps) => <a {...props}>{children}</a>;

const svg = (body: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {body}
  </svg>
);
const CHEV = (
  <svg className="cap-site-header-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const MENU_ICON = svg(<path d="M4 7h16M4 12h16M4 17h16" />);
const PERSON_ICON = svg(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </>,
);

// "Inbox, 4 need you": a count is in the name, with what it counts.
export const countName = (label: string, count?: number, note?: string): string => (count ? `${label}, ${count}${note ? ` ${note}` : ""}` : label);

// An icon control's name, shown on hover and keyboard focus: Capsomer's one tooltip, a child of
// its control, below the header's controls. It repeats the control's name, so it adds no
// description; a press hides it.
export function HeaderTip({ text, keys }: { text: string; keys?: string }) {
  const tip = useRef<HTMLSpanElement>(null);
  useEffect(() => {
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
  }, []);
  return (
    <span ref={tip} className="cap-site-header-tip cap-popover" data-variant="tooltip" data-side="bottom" data-offset="6" popover="manual" role="tooltip" aria-hidden="true">
      <span className="cap-site-header-tip-text">{text}</span>
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

// A disclosure button and its panel, wired by the behaviour module (the open state is the
// platform's popover state, not React's).
function Disclosure({ id, className, label, name, current, align, children, button }: { id: string; className: string; label?: string; name?: string; current?: boolean; align?: "end"; children: ReactNode; button: ReactNode }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (trigger.current && panel.current) return wirePanel(trigger.current, panel.current);
  }, []);
  return (
    <>
      <button ref={trigger} type="button" className={className} data-cap-part="panel-trigger" data-current={current ? "" : undefined} aria-expanded="false" aria-controls={id} aria-label={name}>
        {button}
      </button>
      <div ref={panel} id={id} className="cap-site-header-panel" popover="manual" data-align={align} role="group" aria-label={label}>
        {children}
      </div>
    </>
  );
}

function GroupList({ groups, renderLink }: { groups: HeaderGroup[]; renderLink: (p: LinkProps) => ReactNode }) {
  return (
    <>
      {groups.map((g, i) => (
        <Fragment key={g.label ?? i}>
          {i > 0 && !g.label ? <hr /> : null}
          {g.label ? <div className="cap-site-header-panel-label">{g.label}</div> : null}
          <ul className="cap-site-header-panel-list">
            {g.links.map((l) => (
              <li key={l.id ?? l.href}>
                {renderLink({
                  href: l.href,
                  "aria-current": l.current ? "page" : undefined,
                  "aria-label": l.count ? countName(l.label, l.count, l.countNote) : undefined,
                  children: (
                    <>
                      {l.icon ? <span className="cap-site-header-mark" aria-hidden="true">{l.icon}</span> : null}
                      {l.label}
                      {l.count ? <span className="cap-site-header-count" aria-hidden="true">{badgeText(l.count)}</span> : null}
                    </>
                  ),
                })}
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </>
  );
}

function SheetList({ links, renderLink, onClose }: { links: HeaderLink[]; renderLink: (p: LinkProps) => ReactNode; onClose: () => void }) {
  return (
    <ul className="cap-site-header-sheet-list">
      {links.map((l) => (
        <li key={l.id ?? l.href}>
          {renderLink({
            href: l.href,
            "aria-current": l.current ? "page" : undefined,
            "aria-label": l.count ? countName(l.label, l.count, l.countNote) : undefined,
            onClick: onClose,
            children: (
              <>
                <span className="cap-site-header-sheet-icon" aria-hidden="true">
                  {l.icon}
                </span>
                <span className="cap-site-header-sheet-name">{l.label}</span>
                {l.count ? (
                  <span className="cap-site-header-count" aria-hidden="true">
                    {badgeText(l.count)}
                  </span>
                ) : null}
              </>
            ),
          })}
        </li>
      ))}
    </ul>
  );
}

// A labelled group of rows in the sheet, for a site's own rows (your admin's apps, its menu).
export function SheetGroup({ label, links, renderLink = plainLink, onClose }: { label?: string; links: HeaderLink[]; renderLink?: (p: LinkProps) => ReactNode; onClose: () => void }) {
  return (
    <>
      {label ? <div className="cap-site-header-sheet-label">{label}</div> : null}
      <SheetList links={links} renderLink={renderLink} onClose={onClose} />
    </>
  );
}

const part = (p: SheetPart, close: () => void) => (typeof p === "function" ? p(close) : p);

export function SiteHeader(props: SiteHeaderProps) {
  const { logo, switchers = [], sections = [], links = "left", extras = [], theme = true, themePrefKey = THEME_PREF, themeKey, account, signIn, band, translucent, sticky = true, skipTo, renderLink = plainLink } = props;
  const id = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const sheetTitle = useRef<HTMLHeadingElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // The theme key, where the site binds single keys: not while a person types.
  useEffect(() => {
    if (!theme || !themeKey) return;
    const want = themeKey.toLowerCase();
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== want || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as Element | null)?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      toggleTheme(themePrefKey);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [theme, themeKey, themePrefKey]);

  const icons = extras.filter((e) => e.kind !== "button").slice(0, 2);
  const cta = extras.find((e) => e.kind === "button");
  const signOutLabel = account ? `Sign out (${account.name})` : "Sign out";

  const extra = (e: HeaderExtra) => {
    const name = countName(e.label, e.count, e.countNote);
    const inner = (
      <>
        {e.icon}
        {e.count ? (
          <span className="cap-site-header-badge" aria-hidden="true">
            {badgeText(e.count)}
          </span>
        ) : null}
        <HeaderTip text={e.label} keys={e.keys} />
      </>
    );
    return e.href ? (
      <Fragment key={e.id}>{renderLink({ href: e.href, className: "cap-site-header-icon", "aria-label": name, children: inner })}</Fragment>
    ) : (
      <button key={e.id} type="button" className="cap-site-header-icon" aria-label={name} onClick={e.onClick}>
        {inner}
      </button>
    );
  };

  const accountPanel = account ? (
    (account.panel ?? (
      <>
        <div className="cap-site-header-who">
          <strong>{account.name}</strong>
          {account.detail ? <small>{account.detail}</small> : null}
        </div>
        {account.groups?.map((g, i) => (
          <Fragment key={g.label ?? i}>
            <hr />
            {g.label ? <div className="cap-site-header-panel-label">{g.label}</div> : null}
            <ul className="cap-site-header-panel-list">
              {g.links.map((l) => (
                <li key={l.label}>
                  {l.href ? (
                    renderLink({ href: l.href, "aria-current": l.current ? "page" : undefined, children: l.label })
                  ) : (
                    <button type="button" data-panel-close="" onClick={l.onClick}>
                      {l.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Fragment>
        ))}
        {account.onSignOut || account.signOutHref ? (
          <>
            <hr />
            <ul className="cap-site-header-panel-list">
              <li>
                {account.signOutHref ? (
                  <a href={account.signOutHref}>Sign out</a>
                ) : (
                  <button type="button" data-panel-close="" disabled={account.signOutDisabled} onClick={account.onSignOut}>
                    Sign out
                  </button>
                )}
              </li>
            </ul>
          </>
        ) : null}
      </>
    ))
  ) : null;

  const sectionLinks = sections.filter((s) => !s.groups && !s.panel && s.href).map((s): HeaderLink => ({ id: s.id, label: s.label, href: s.href!, current: s.current }));
  const sheetName = props.sheetTitle ?? `${logo.label} menu`;

  return (
    // data-cap-ready: React wires this header itself, so a page-wide enhance() leaves it alone.
    <header className="cap-site-header" data-cap="site-header" data-cap-ready="" data-links={links} data-band={band} data-translucent={translucent ? "" : undefined} data-sticky={sticky ? undefined : "false"}>
      {skipTo ? (
        <a className="cap-site-header-skip" href={skipTo}>
          Skip to content
        </a>
      ) : null}
      {renderLink({
        href: logo.href,
        className: "cap-site-header-logo",
        "aria-label": logo.label,
        children: (
          <>
            {logo.mark}
            {logo.wordmark ?? <span aria-hidden="true">{logo.label}</span>}
          </>
        ),
      })}
      {switchers.length > 0 ? (
        <div className="cap-site-header-switcher">
          {switchers.map((s, i) => (
            <Fragment key={s.id}>
              {i > 0 ? (
                <span className="cap-site-header-sep" aria-hidden="true">
                  /
                </span>
              ) : null}
              <Disclosure
                id={`${id}-${s.id}`}
                className="cap-site-header-switch"
                name={s.name}
                label={s.sheetLabel ?? s.name ?? s.label}
                button={
                  <>
                    {s.tile ? (
                      <span className="cap-site-header-switch-tile" aria-hidden="true">
                        {s.tile}
                      </span>
                    ) : (
                      s.mark
                    )}
                    <span>{s.label}</span>
                    {CHEV}
                  </>
                }
              >
                {s.panel ?? <GroupList groups={s.groups} renderLink={renderLink} />}
              </Disclosure>
            </Fragment>
          ))}
        </div>
      ) : null}
      {sections.length > 0 ? (
        <nav className="cap-site-header-sections" aria-label="Site">
          <ul>
            {sections.map((s) => (
              <li key={s.id}>
                {s.groups || s.panel ? (
                  <Disclosure
                    id={`${id}-${s.id}`}
                    className="cap-site-header-link"
                    current={s.current}
                    label={s.label}
                    button={
                      <>
                        {s.label}
                        {CHEV}
                      </>
                    }
                  >
                    {s.panel ?? <GroupList groups={s.groups ?? []} renderLink={renderLink} />}
                  </Disclosure>
                ) : (
                  renderLink({ href: s.href ?? "#", className: "cap-site-header-link", "aria-current": s.current ? "page" : undefined, children: s.label })
                )}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div className="cap-site-header-tools">
        {icons.length > 0 || cta ? (
          <div className="cap-site-header-extras">
            {icons.map(extra)}
            {cta ? (
              cta.href ? (
                renderLink({ href: cta.href, className: "cap-site-header-cta", children: cta.label })
              ) : (
                <button type="button" className="cap-site-header-cta" onClick={cta.onClick}>
                  {cta.label}
                </button>
              )
            ) : null}
          </div>
        ) : null}
        {theme ? <ThemeButton prefKey={themePrefKey} shortcut={themeKey} className="cap-site-header-icon cap-site-header-theme" /> : null}
        <div className="cap-site-header-account">
          {account ? (
            <Disclosure
              id={`${id}-account`}
              className="cap-site-header-icon cap-site-header-avatar"
              name="Your account"
              label="Your account"
              align="end"
              button={
                <>
                  <span className="cap-site-header-initials" aria-hidden="true">
                    {account.initials}
                  </span>
                  <HeaderTip text={account.name} />
                </>
              }
            >
              {accountPanel}
            </Disclosure>
          ) : signIn ? (
            renderLink({
              href: signIn.href,
              className: "cap-site-header-signin",
              children: (
                <>
                  {PERSON_ICON}
                  <span className="cap-site-header-signin-text">{signIn.label ?? "Sign in"}</span>
                </>
              ),
            })
          ) : null}
        </div>
        <button ref={menuButton} type="button" className="cap-site-header-icon cap-site-header-menu" aria-label="Menu" aria-haspopup="dialog" aria-expanded={sheetOpen} aria-controls={`${id}-sheet`} onClick={() => setSheetOpen(true)}>
          {MENU_ICON}
        </button>
      </div>
      <Dialog open={sheetOpen} onOpenChange={(o) => !o && closeSheet()} placement="bottom" id={`${id}-sheet`} className="cap-site-header-sheet" aria-labelledby={`${id}-sheet-title`} initialFocus={sheetTitle}>
        <DialogHeader>
          <h2 id={`${id}-sheet-title`} className="cap-dialog-title cap-site-header-sheet-title" ref={sheetTitle} tabIndex={-1}>
            {sheetName}
          </h2>
        </DialogHeader>
        <DialogBody>
          <nav aria-labelledby={`${id}-sheet-title`}>
            {part(props.sheetStart, closeSheet)}
            {switchers.map((s) =>
              s.groups.map((g, i) => <SheetGroup key={`${s.id}-${i}`} label={g.label ?? s.sheetLabel ?? s.label} links={g.links} renderLink={renderLink} onClose={closeSheet} />),
            )}
            {sections
              .filter((s) => s.groups)
              .map((s) => (
                <SheetGroup key={s.id} label={s.label} links={(s.groups ?? []).flatMap((g) => g.links)} renderLink={renderLink} onClose={closeSheet} />
              ))}
            {sectionLinks.length > 0 ? <SheetGroup label={sections.some((s) => s.groups) ? "More" : "Pages"} links={sectionLinks} renderLink={renderLink} onClose={closeSheet} /> : null}
            {part(props.sheetEnd, closeSheet)}
            {cta?.href ? renderLink({ href: cta.href, className: "cap-site-header-sheet-cta", onClick: closeSheet, children: cta.label }) : null}
          </nav>
        </DialogBody>
        {account || signIn ? (
          <nav className="cap-site-header-sheet-account" aria-label="Account">
            <ul className="cap-site-header-sheet-list">
              {account?.groups
                ?.flatMap((g) => g.links)
                .map((l) => {
                  const inner = (
                    <>
                      <span className="cap-site-header-sheet-icon" aria-hidden="true" />
                      <span className="cap-site-header-sheet-name">{l.label}</span>
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
              {account && (account.onSignOut || account.signOutHref) ? (
                <li>
                  {account.signOutHref ? (
                    <a href={account.signOutHref}>
                      <span className="cap-site-header-sheet-icon" aria-hidden="true" />
                      <span className="cap-site-header-sheet-name">{signOutLabel}</span>
                    </a>
                  ) : (
                    <button type="button" disabled={account.signOutDisabled} onClick={() => (closeSheet(), account.onSignOut?.())}>
                      <span className="cap-site-header-sheet-icon" aria-hidden="true" />
                      <span className="cap-site-header-sheet-name">{signOutLabel}</span>
                    </button>
                  )}
                </li>
              ) : null}
              {!account && signIn ? (
                <li>
                  {renderLink({
                    href: signIn.href,
                    onClick: closeSheet,
                    children: (
                      <>
                        <span className="cap-site-header-sheet-icon" aria-hidden="true" />
                        <span className="cap-site-header-sheet-name">{signIn.label ?? "Sign in"}</span>
                      </>
                    ),
                  })}
                </li>
              ) : null}
            </ul>
          </nav>
        ) : null}
      </Dialog>
    </header>
  );
}

// The bottom bar of a signed-in area on a phone: up to five of its top pages, no More (the menu
// button opens the full list). Shown under 768px only. Put it last in the page, so it sticks to the
// window's bottom edge.
export function SiteTabs({ tabs, label = "Sections", renderLink = plainLink }: { tabs: HeaderLink[]; label?: string; renderLink?: (p: LinkProps) => ReactNode }) {
  return (
    <nav className="cap-site-tabs" aria-label={label}>
      {tabs.slice(0, 5).map((t) => (
        <Fragment key={t.id ?? t.href}>
          {renderLink({
            href: t.href,
            "aria-current": t.current ? "page" : undefined,
            "aria-label": t.count ? countName(t.label, t.count, t.countNote) : undefined,
            children: (
              <>
                {t.icon}
                {t.label}
                {t.count ? (
                  <span className="cap-site-header-badge" aria-hidden="true">
                    {badgeText(t.count)}
                  </span>
                ) : null}
              </>
            ),
          })}
        </Fragment>
      ))}
    </nav>
  );
}
