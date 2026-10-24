// The site header's props and the small parts its panels and sheet are built from (site-header.react.tsx).

import { Fragment, type ReactNode, useEffect, useRef } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";
import { badgeText, wirePanel } from "./site-header.ts";

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
  // Drawn as the avatar when there is no picture, or under one that fails to load.
  initials: string;
  // A picture of the person (its address), drawn over the initials in the account button.
  avatar?: string;
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

export const plainLink = ({ children, ...props }: LinkProps) => <a {...props}>{children}</a>;

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
export const countName = (label: string, count?: number, note?: string): string => (count ? `${label}${count > 99 ? " 99+" : ""}, ${count}${note ? ` ${note}` : ""}` : label);

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
      <TipKeys keys={keys} />
    </span>
  );
}

// A disclosure button and its panel, wired by the behaviour module (the open state is the
// platform's popover state, not React's).
export function Disclosure({ id, className, label, name, current, align, children, button }: { id: string; className: string; label?: string; name?: string; current?: boolean; align?: "end"; children: ReactNode; button: ReactNode }) {
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

export function GroupList({ groups, renderLink }: { groups: HeaderGroup[]; renderLink: (p: LinkProps) => ReactNode }) {
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
                      {l.count ? " " : null}
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
                {l.count ? " " : null}
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

export const part = (p: SheetPart, close: () => void) => (typeof p === "function" ? p(close) : p);
