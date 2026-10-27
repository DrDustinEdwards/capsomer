import { Fragment, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogBody, DialogHeader } from "../dialog/dialog.react.tsx";
import type { LinkProps } from "../shell/shell.react.tsx";
import { ThemeButton } from "../theme-switch/theme-switch.react.tsx";
import { THEME_PREF, toggleTheme } from "../theme-switch/theme-switch.ts";
import { CHEV, Disclosure, GroupList, type HeaderExtra, type HeaderLink, HeaderTip, MENU_ICON, PERSON_ICON, SEARCH_ICON, SheetGroup, type SiteHeaderProps, countName, part, plainLink } from "./site-header-parts.react.tsx";
import { badgeText } from "./site-header.ts";

export { countName, HeaderTip, SheetGroup } from "./site-header-parts.react.tsx";
export type { HeaderLink, HeaderGroup, HeaderLogo, HeaderSwitcher, HeaderSection, HeaderExtra, HeaderAccountLink, HeaderAccount, SheetPart, SiteHeaderProps } from "./site-header-parts.react.tsx";

export type { LinkProps };

export function SiteHeader(props: SiteHeaderProps) {
  const { logo, switchers = [], sections = [], links = "left", extras = [], theme = true, themePrefKey = THEME_PREF, themeKey, account, signIn, band, translucent, sticky = true, skipTo, renderLink = plainLink, variant, search, trail } = props;
  const letterhead = variant === "letterhead";
  const id = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const sheetTitle = useRef<HTMLHeadingElement>(null);
  // A picture that fails to load gives way to the initials under it.
  const [failedAvatar, setFailedAvatar] = useState<string>();
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
    <header className="cap-site-header" data-cap="site-header" data-cap-ready="" data-variant={variant} data-links={links} data-band={band} data-translucent={translucent ? "" : undefined} data-sticky={sticky ? undefined : "false"}>
      {skipTo ? (
        <a className="cap-site-header-skip" href={skipTo}>
          Skip to content
        </a>
      ) : null}
      {renderLink({
        href: logo.href,
        className: "cap-site-header-logo",
        "aria-label": letterhead ? [logo.agency, logo.label, logo.app].filter(Boolean).join(" ") : logo.label,
        children: (
          <>
            {logo.mark}
            {letterhead ? (
              <span className="cap-site-header-names" aria-hidden="true">
                {logo.agency ? <span className="cap-site-header-agency">{logo.agency}</span> : null}
                <span className="cap-site-header-name">
                  {logo.label}
                  {logo.app ? <span className="cap-site-header-app"> {logo.app}</span> : null}
                </span>
              </span>
            ) : (
              (logo.wordmark ?? <span aria-hidden="true">{logo.label}</span>)
            )}
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
                      <span className="cap-site-header-switch-tile" data-tile={s.tile} aria-hidden="true" />
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
        {search ? (
          <form className="cap-site-header-search" role="search" action={search.action}>
            <button type="submit" aria-label={search.label}>
              {SEARCH_ICON}
            </button>
            <input type="search" name={search.name ?? "q"} placeholder={search.label} aria-label={search.label} autoComplete="off" />
          </form>
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
                  <span className="cap-site-header-initials" data-initials={account.initials} aria-hidden="true">
                    {account.avatar && account.avatar !== failedAvatar ? <img className="cap-site-header-avatar-image" src={account.avatar} alt="" onError={() => setFailedAvatar(account.avatar)} /> : null}
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
      {letterhead && trail ? (
        <div className="cap-site-header-trail">
          <nav aria-label="You are here">
            <ol>
              {trail.crumbs.map((c) => (
                <li key={c.label}>{c.href && !c.current ? renderLink({ href: c.href, children: c.label }) : <span aria-current={c.current ? "page" : undefined}>{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
          {trail.viewSite ? renderLink({ href: trail.viewSite, className: "cap-site-header-view", children: "View site" }) : null}
        </div>
      ) : null}
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
                {t.count ? " " : null}
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
