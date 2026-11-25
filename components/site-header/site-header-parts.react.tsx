// The site header's props and the small parts its panels and sheet are built from.

import { createContext, Fragment, type ReactNode, useContext, useEffect, useRef } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";
import { badgeText, wirePanel } from "./site-header.ts";
import { plainLink } from "../hooks/hooks.react.tsx";
import {
  type HeaderDoes,
  type HeaderItem,
  type HeaderGroup,
  type SheetPart,
} from "./site-header-types.ts";
export type {
  HeaderLink,
  HeaderDoes,
  HeaderActionItem,
  HeaderItem,
  HeaderGroup,
  HeaderLogo,
  HeaderSwitcher,
  HeaderSection,
  HeaderExtra,
  HeaderAccountLink,
  HeaderAccount,
  SheetPart,
  SiteHeaderProps,
} from "./site-header-types.ts";

// Whether React wires the header in the browser (`hydrate`). If not, the behavior module owns every
// listener, so nothing is wired twice.
export const HeaderHydrates = createContext(true);

// One row of a panel or the sheet: a link (`href`), a posting form (`action`) or a button
// (`onClick`). `onClose` closes the sheet first; a panel closes itself on any row.
export function headerItem(
  item: { href?: string; current?: boolean; label: string } & HeaderDoes,
  children: ReactNode,
  renderLink: (p: LinkProps) => ReactNode,
  {
    onClose,
    ariaLabel,
    disabled,
  }: { onClose?: () => void; ariaLabel?: string; disabled?: boolean } = {},
): ReactNode {
  if (item.href)
    return renderLink({
      href: item.href,
      "aria-current": item.current ? "page" : undefined,
      "aria-label": ariaLabel,
      onClick: onClose,
      children,
    });
  const run = () => {
    onClose?.();
    item.onClick?.();
  };
  if (item.action)
    return (
      <form className="cap-site-header-form" method={item.method ?? "post"} action={item.action}>
        {Object.entries(item.fields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type={item.current ? "button" : "submit"}
          data-panel-close=""
          aria-current={item.current ? "true" : undefined}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={run}
        >
          {children}
        </button>
      </form>
    );
  return (
    <button
      type="button"
      data-panel-close=""
      aria-current={item.current ? "true" : undefined}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={run}
    >
      {children}
    </button>
  );
}

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
export const SEARCH_ICON = svg(<path d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.2-3.2" />);
export const PERSON_ICON = svg(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </>,
);

// "Inbox, 4 need you". Past 99 the badge reads 99+, so the name starts with what is seen and keeps
// the real count ("Inbox 99+, 120 need you"). The visible label and count must be words of the name
// in that order (WCAG 2.5.3; axe's label-content-name-mismatch reads aria-hidden text too).
export const countName = (label: string, count?: number, note?: string): string =>
  count ? `${label}${count > 99 ? " 99+" : ""}, ${count}${note ? ` ${note}` : ""}` : label;

export function TipKeys({ keys }: { keys?: string }) {
  return keys ? (
    <span className="cap-keys">
      {keys.split(" ").map((k) => (
        <kbd key={k}>{k}</kbd>
      ))}
    </span>
  ) : null;
}

// An icon control's name tip, a child of its control. It repeats the name, so it adds no description.
export function HeaderTip({ text, keys }: { text: string; keys?: string }) {
  const tip = useRef<HTMLSpanElement>(null);
  const hydrates = useContext(HeaderHydrates);
  useEffect(() => {
    if (!hydrates) return;
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
  }, [hydrates]);
  return (
    <span
      ref={tip}
      className="cap-site-header-tip cap-popover"
      data-variant="tooltip"
      data-side="bottom"
      data-offset="6"
      popover="manual"
      role="tooltip"
      aria-hidden="true"
    >
      <span className="cap-site-header-tip-text">{text}</span>
      <TipKeys keys={keys} />
    </span>
  );
}

// A disclosure button and its panel, wired by the behavior module; the open state is the popover's,
// not React's. `popovertarget` opens it with no script; with script the behavior cancels the native toggle.
export function Disclosure({
  id,
  className,
  label,
  name,
  current,
  align,
  size,
  panelClassName,
  children,
  button,
}: {
  id: string;
  className: string;
  label?: string;
  name?: string;
  current?: boolean;
  align?: "end";
  size?: "wide";
  panelClassName?: string;
  children: ReactNode;
  button: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const hydrates = useContext(HeaderHydrates);
  useEffect(() => {
    if (hydrates && trigger.current && panel.current)
      return wirePanel(trigger.current, panel.current);
  }, [hydrates]);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={className}
        data-cap-part="panel-trigger"
        data-current={current ? "" : undefined}
        popoverTarget={id}
        aria-expanded="false"
        aria-controls={id}
        aria-label={name}
      >
        {button}
      </button>
      <div
        ref={panel}
        id={id}
        className={
          panelClassName ? `cap-site-header-panel ${panelClassName}` : "cap-site-header-panel"
        }
        popover="manual"
        data-align={align}
        data-size={size}
        role="group"
        aria-label={label}
      >
        {children}
      </div>
    </>
  );
}

export function GroupList({
  groups,
  renderLink,
}: {
  groups: HeaderGroup[];
  renderLink: (p: LinkProps) => ReactNode;
}) {
  return (
    <>
      {groups.map((g, i) => (
        <Fragment key={g.label ?? i}>
          {i > 0 && !g.label ? <hr /> : null}
          {g.label ? <div className="cap-site-header-panel-label">{g.label}</div> : null}
          <ul className="cap-site-header-panel-list">
            {g.links.map((l) => (
              <li key={l.id ?? l.href ?? l.label}>
                {headerItem(
                  l,
                  <>
                    {l.icon ? (
                      <span className="cap-site-header-mark" aria-hidden="true">
                        {l.icon}
                      </span>
                    ) : null}
                    {l.label}
                    {l.count ? " " : null}
                    {l.count ? (
                      <span
                        className="cap-count cap-site-header-count"
                        data-tone="need"
                        aria-hidden="true"
                      >
                        {badgeText(l.count)}
                      </span>
                    ) : null}
                  </>,
                  renderLink,
                  { ariaLabel: l.count ? countName(l.label, l.count, l.countNote) : undefined },
                )}
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </>
  );
}

function SheetList({
  links,
  renderLink,
  onClose,
}: {
  links: HeaderItem[];
  renderLink: (p: LinkProps) => ReactNode;
  onClose: () => void;
}) {
  return (
    <ul className="cap-site-header-sheet-list">
      {links.map((l) => (
        <li key={l.id ?? l.href ?? l.label}>
          {headerItem(
            l,
            <>
              <span className="cap-site-header-sheet-icon" aria-hidden="true">
                {l.icon}
              </span>
              <span className="cap-site-header-sheet-name">{l.label}</span>
              {l.count ? " " : null}
              {l.count ? (
                <span
                  className="cap-count cap-site-header-count"
                  data-tone="need"
                  aria-hidden="true"
                >
                  {badgeText(l.count)}
                </span>
              ) : null}
            </>,
            renderLink,
            {
              onClose,
              ariaLabel: l.count ? countName(l.label, l.count, l.countNote) : undefined,
            },
          )}
        </li>
      ))}
    </ul>
  );
}

export function SheetGroup({
  label,
  links,
  renderLink = plainLink,
  onClose,
}: {
  label?: string;
  links: HeaderItem[];
  renderLink?: (p: LinkProps) => ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      {label ? <div className="cap-site-header-sheet-label">{label}</div> : null}
      <SheetList links={links} renderLink={renderLink} onClose={onClose} />
    </>
  );
}

export const part = (p: SheetPart, close: () => void) => (typeof p === "function" ? p(close) : p);
