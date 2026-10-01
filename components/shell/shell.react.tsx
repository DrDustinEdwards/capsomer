import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_PREF, readPref, writePref } from "./shell.ts";

export interface ShellEntry {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  current?: boolean;
  // A count beside the entry, and what it counts: "Queue, 2 blocked".
  count?: number;
  countNote?: string;
  tone?: "crit" | "warn";
}

export interface LinkProps {
  href: string;
  className?: string;
  "aria-current"?: "page";
  "aria-label"?: string;
  children: ReactNode;
}

export interface ShellProps {
  brand: ReactNode;
  brandHref?: string;
  nav: ShellEntry[];
  // At most five; the last one is More when there are more views than fit.
  tabs?: ShellEntry[];
  navLabel?: string;
  // The top bar, left to right after the brand: a status, then actions. Put the theme
  // switch, then Settings, then Sign out (where there is one) last in `actions`.
  status?: ReactNode;
  actions?: ReactNode;
  railFoot?: ReactNode;
  prefKey?: string;
  // A router's link component; a plain <a> by default.
  renderLink?: (props: LinkProps) => ReactNode;
  // Controlled collapse, for an app that binds a key to it.
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  children: ReactNode;
}

const RailIcon = () => (
  <svg className="cap-shell-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.5 2.5h11v11h-11zM6 2.5v11M10.5 6 8.5 8l2 2" />
  </svg>
);

const plainLink = ({ children, ...props }: LinkProps) => <a {...props}>{children}</a>;

export function Shell(props: ShellProps) {
  const { brand, brandHref = "./", nav, tabs, navLabel = "Sections", status, actions, railFoot, prefKey = DEFAULT_PREF, renderLink = plainLink, children } = props;
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
  if (tabs && tabs.length > 5 && import.meta.env?.DEV) console.warn("Shell: a phone tab bar holds at most five entries; make the last one More.");

  const entry = (e: ShellEntry, phone: boolean) => {
    const named = e.count ? `${e.label}, ${e.count}${e.countNote ? ` ${e.countNote}` : ""}` : undefined;
    return (
      <Fragment key={e.id}>
        {renderLink({
          href: e.href,
          "aria-current": e.current ? "page" : undefined,
          "aria-label": named,
          children: phone ? (
            <>
              {e.icon}
              {e.label}
              {e.count ? <span className="cap-shell-badge">{e.count}</span> : null}
            </>
          ) : (
            <>
              {e.icon ?? <span aria-hidden="true" />}
              <span className="cap-shell-label">{e.label}</span>
              <span className="cap-shell-count" data-tone={e.tone}>
                {e.count ? e.count : ""}
              </span>
            </>
          ),
        })}
      </Fragment>
    );
  };

  return (
    <div className="cap-shell" data-cap="shell" data-rail={collapsed ? "collapsed" : undefined}>
      <a className="cap-shell-skip" href="#cap-main">
        Skip to content
      </a>
      <header className="cap-shell-top">
        {renderLink({ href: brandHref, className: "cap-shell-brand", children: brand })}
        <div className="cap-shell-spacer" />
        {status}
        <div className="cap-shell-actions">{actions}</div>
      </header>
      <nav className="cap-shell-rail" id="cap-rail" aria-label={navLabel}>
        {nav.map((e) => entry(e, false))}
        <div className="cap-shell-foot">
          {railFoot}
          <button type="button" className="cap-shell-toggle" data-cap-part="rail-toggle" aria-expanded={!collapsed} aria-controls="cap-rail" onClick={() => setCollapsed(!collapsed)}>
            <RailIcon />
            <span className="cap-shell-label">{collapsed ? "Expand menu" : "Collapse menu"}</span>
            <kbd aria-hidden="true">[</kbd>
          </button>
        </div>
      </nav>
      <main className="cap-shell-main" id="cap-main" tabIndex={-1}>
        {children}
      </main>
      {tabs && tabs.length > 0 && (
        <nav className="cap-shell-tabs" aria-label={navLabel}>
          {tabs.map((e) => entry(e, true))}
        </nav>
      )}
    </div>
  );
}
