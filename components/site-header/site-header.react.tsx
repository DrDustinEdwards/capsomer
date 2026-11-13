import { Fragment, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogBody, DialogHeader } from "../dialog/dialog.react.tsx";
import type { LinkProps } from "../shell/shell.react.tsx";
import { ThemeButton, ThemeForm } from "../theme-switch/theme-switch.react.tsx";
import { enhance as enhanceTheme, THEME_PREF } from "../theme-switch/theme-switch.ts";
import {
  CHEV,
  Disclosure,
  GroupList,
  type HeaderExtra,
  HeaderHydrates,
  type HeaderLink,
  HeaderTip,
  MENU_ICON,
  PERSON_ICON,
  SEARCH_ICON,
  SheetGroup,
  type SiteHeaderProps,
  countName,
  headerItem,
  part,
  plainLink,
} from "./site-header-parts.react.tsx";
import { badgeText, guardForms, wireScrolled, wireSearch, wireThemeKey } from "./site-header.ts";

export { countName, HeaderTip, SheetGroup } from "./site-header-parts.react.tsx";
export { initialsOf } from "./site-header.ts";
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
} from "./site-header-parts.react.tsx";

export type { LinkProps };

export function SiteHeader(props: SiteHeaderProps) {
  const {
    logo,
    switchers = [],
    sections = [],
    links = "left",
    extras = [],
    theme = true,
    themePrefKey = THEME_PREF,
    themeKey,
    themeCookie,
    onThemeSave,
    themeInitial,
    themeAction,
    hydrate = true,
    navLabel = "Main",
    sheetLinksLabel,
    account,
    signIn,
    band,
    translucent,
    rest,
    sticky = true,
    skipTo,
    renderLink = plainLink,
    variant,
    search,
    trail,
    attributes,
    toolsEnd,
    end,
    collapse,
    sheetIcons,
    menuIcon = MENU_ICON,
  } = props;
  const letterhead = variant === "letterhead";
  const id = useId();
  const headerRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sheetTitle = useRef<HTMLHeadingElement>(null);
  // A picture that fails to load gives way to the initials under it.
  const [failedAvatar, setFailedAvatar] = useState<string>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // A form in a panel or the sheet sends once (guardForms); Back and Forward close the sheet.
  useEffect(() => {
    if (!hydrate || !headerRef.current) return;
    const back = () => setSheetOpen(false);
    window.addEventListener("popstate", back);
    const unguard = guardForms(headerRef.current);
    const unscroll = wireScrolled(headerRef.current);
    return () => {
      window.removeEventListener("popstate", back);
      unguard();
      unscroll();
    };
  }, [hydrate]);

  // The theme key, where the site binds single keys: not while a person types. It presses the
  // header's theme control, so the key keeps the choice exactly as the control does.
  useEffect(() => {
    if (!hydrate || !theme || !themeKey || !headerRef.current) return;
    return wireThemeKey(headerRef.current, themeKey);
  }, [hydrate, theme, themeKey]);

  // The no-script theme form is plain markup; with React running, the behavior wires it here.
  const saveRef = useRef(onThemeSave);
  useEffect(() => {
    saveRef.current = onThemeSave;
  });
  useEffect(() => {
    if (!hydrate || !theme || !themeAction || !headerRef.current) return;
    return enhanceTheme(headerRef.current, {
      onSave: (c) => saveRef.current?.(c),
    });
  }, [hydrate, theme, themeAction]);

  // Search: the icon opens the field; where the site answers queries, its matches show as one types.
  const searchBox = useRef<HTMLDivElement>(null);
  const suggest = search?.suggest;
  useEffect(() => {
    if (!hydrate || !searchBox.current) return;
    return wireSearch(searchBox.current, suggest);
  }, [hydrate, suggest]);

  // In the letterhead an app's own search (an extra with id "search", say a command menu) takes the
  // search slot before the theme, where a site's search form sits, so it never moves between them.
  const ownSearch =
    letterhead && !search
      ? extras.find((e) => e.id === "search" && e.kind !== "button")
      : undefined;
  const icons = extras.filter((e) => e.kind !== "button" && e !== ownSearch).slice(0, 2);
  const cta = extras.find((e) => e.kind === "button");
  // The site's own class on its button extra (bsw's glass Get a Quote), in the bar and the sheet.
  const ctaClass = cta?.className ? `cap-site-header-cta ${cta.className}` : "cap-site-header-cta";
  const signOutLabel = account ? `Sign out (${account.name})` : "Sign out";
  // Sign out as a row: a link, a form post (no script needed), or a button.
  const signOut = account
    ? account.signOutHref
      ? { label: "Sign out", href: account.signOutHref }
      : account.signOutAction
        ? { label: "Sign out", action: account.signOutAction, fields: account.signOutFields }
        : account.onSignOut
          ? { label: "Sign out", onClick: account.onSignOut }
          : undefined
    : undefined;

  const extra = (e: HeaderExtra) => {
    const name = countName(e.label, e.count, e.countNote);
    const inner = (
      <>
        {e.icon}
        {e.count ? (
          <span className="cap-count cap-site-header-badge" data-tone="need" aria-hidden="true">
            {badgeText(e.count)}
          </span>
        ) : null}
        <HeaderTip text={e.label} keys={e.keys} />
      </>
    );
    return e.href ? (
      <Fragment key={e.id}>
        {renderLink({
          href: e.href,
          className: e.className ? `cap-site-header-icon ${e.className}` : "cap-site-header-icon",
          "aria-label": name,
          children: inner,
        })}
      </Fragment>
    ) : (
      <button
        key={e.id}
        type="button"
        className={e.className ? `cap-site-header-icon ${e.className}` : "cap-site-header-icon"}
        aria-label={name}
        onClick={e.onClick}
      >
        {inner}
      </button>
    );
  };

  // The letterhead's second row already shows View site wherever the account button is in the bar
  // (from 768px; on a phone the account is in the sheet, which keeps the row), so the menu leaves
  // it out rather than offering it twice.
  const shownView = letterhead && trail?.viewSite ? trail.viewSite : undefined;
  const panelGroups = (account?.groups ?? [])
    .map((g) => ({
      ...g,
      links: shownView ? g.links.filter((l) => l.href !== shownView) : g.links,
    }))
    .filter((g) => g.links.length > 0);

  const accountPanel = account
    ? (account.panel ?? (
        <>
          <div className="cap-site-header-who">
            <strong>{account.name}</strong>
            {account.detail ? <small>{account.detail}</small> : null}
          </div>
          {panelGroups.map((g, i) => (
            <Fragment key={g.label ?? i}>
              <hr />
              {g.label ? <div className="cap-site-header-panel-label">{g.label}</div> : null}
              <ul className="cap-site-header-panel-list">
                {g.links.map((l) => (
                  <li key={l.label}>{headerItem(l, l.label, renderLink)}</li>
                ))}
              </ul>
            </Fragment>
          ))}
          {signOut ? (
            <>
              <hr />
              <ul className="cap-site-header-panel-list">
                <li>
                  {/* A plain link: Sign out leaves the app, so it is a full load, never the router's. */}
                  {headerItem(signOut, "Sign out", plainLink, {
                    disabled: account.signOutDisabled,
                  })}
                </li>
              </ul>
            </>
          ) : null}
        </>
      ))
    : null;

  const sectionLinks = sections
    .filter((s) => !s.groups && !s.panel && s.href)
    .map((s): HeaderLink => ({ id: s.id, label: s.label, href: s.href!, current: s.current }));
  const sheetName = props.sheetTitle ?? `${logo.label} menu`;
  const linksLabel =
    sheetLinksLabel === undefined
      ? sections.some((s) => s.groups)
        ? "More"
        : "Pages"
      : (sheetLinksLabel ?? undefined);

  return (
    <HeaderHydrates.Provider value={hydrate}>
      {/* data-cap-ready: React wires this header itself, so a page-wide enhance() leaves it alone.
        Without hydration it is left off, and enhance() wires the same markup (with the theme key). */}
      <header
        {...attributes}
        ref={headerRef}
        className="cap-site-header"
        data-cap="site-header"
        data-cap-ready={hydrate ? "" : undefined}
        data-cap-theme-key={!hydrate && theme && themeKey ? themeKey : undefined}
        data-variant={variant}
        data-links={links}
        data-collapse={collapse}
        data-sheet-icons={sheetIcons}
        data-band={band}
        data-translucent={translucent ? "" : undefined}
        data-rest={rest}
        data-sticky={sticky ? undefined : "false"}
      >
        {rest === "clear" ? <span className="cap-site-header-ground" aria-hidden="true" /> : null}
        {skipTo ? (
          <a className="cap-site-header-skip" href={skipTo}>
            Skip to content
          </a>
        ) : null}
        {renderLink({
          href: logo.href,
          className: logo.className
            ? `cap-site-header-logo ${logo.className}`
            : "cap-site-header-logo",
          "aria-label":
            logo.name ??
            (letterhead
              ? [logo.agency, logo.label, logo.app].filter(Boolean).join(" ")
              : logo.label),
          children: (
            <>
              {logo.mark}
              {letterhead ? (
                <span className="cap-site-header-names" aria-hidden="true">
                  {logo.agency ? (
                    <span className="cap-site-header-agency">{logo.agency}</span>
                  ) : null}
                  {/* A space, so the visible text reads "Dustin Edwards Capsid" as the name does (WCAG 2.5.3). */}
                  {logo.agency ? " " : null}
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
                  size={s.panelSize}
                  panelClassName={s.panelClassName}
                  button={
                    <>
                      {s.tile ? (
                        <span
                          className="cap-site-header-switch-tile"
                          data-tile={s.tile}
                          aria-hidden="true"
                        />
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
          <nav className="cap-site-header-sections" aria-label={navLabel}>
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  {s.groups || s.panel ? (
                    <Disclosure
                      id={`${id}-${s.id}`}
                      className="cap-site-header-link"
                      current={s.current}
                      label={s.label}
                      size={s.panelSize}
                      panelClassName={s.panelClassName}
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
                    renderLink({
                      href: s.href ?? "#",
                      className: "cap-site-header-link",
                      "aria-current": s.current ? "page" : undefined,
                      children: s.label,
                    })
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <div className="cap-site-header-tools">
          {ownSearch ? extra(ownSearch) : null}
          {icons.length > 0 || cta ? (
            // data-phone="bar": the button extra stays in the phone's top row.
            <div className="cap-site-header-extras" data-phone={cta?.phone}>
              {icons.map(extra)}
              {cta ? (
                cta.href ? (
                  renderLink({
                    href: cta.href,
                    className: ctaClass,
                    children: cta.label,
                  })
                ) : (
                  <button type="button" className={ctaClass} onClick={cta.onClick}>
                    {cta.label}
                  </button>
                )
              ) : null}
            </div>
          ) : null}
          {search ? (
            <div ref={searchBox} className="cap-site-header-search" data-cap-part="search">
              <a
                className="cap-site-header-icon cap-site-header-search-button"
                href={search.action}
                aria-label={search.label}
                data-cap-part="search-trigger"
              >
                {SEARCH_ICON}
                <HeaderTip text={search.label} keys="/" />
              </a>
              <div className="cap-site-header-search-panel" data-align="end">
                <form role="search" aria-label={search.label} action={search.action} method="get">
                  {SEARCH_ICON}
                  <input
                    type="search"
                    name={search.name ?? "q"}
                    placeholder={search.label}
                    aria-label={search.label}
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                </form>
              </div>
            </div>
          ) : null}
          {theme ? (
            themeAction ? (
              <ThemeForm
                action={themeAction}
                cookie={themeCookie}
                prefKey={themePrefKey}
                shortcut={themeKey}
                className="cap-site-header-icon cap-site-header-theme"
              />
            ) : (
              <ThemeButton
                prefKey={themePrefKey}
                shortcut={themeKey}
                className="cap-site-header-icon cap-site-header-theme"
                cookie={themeCookie}
                onSave={onThemeSave}
                initial={themeInitial}
                hydrate={hydrate}
              />
            )
          ) : null}
          <AccountSlot show={Boolean(account || signIn)}>
            {account ? (
              <Disclosure
                id={`${id}-account`}
                className="cap-site-header-icon cap-site-header-avatar"
                name="Your account"
                label="Your account"
                align="end"
                button={
                  <>
                    <span
                      className="cap-site-header-initials"
                      data-initials={account.initials}
                      aria-hidden="true"
                    >
                      {account.avatar && account.avatar !== failedAvatar ? (
                        <img
                          className="cap-site-header-avatar-image"
                          src={account.avatar}
                          alt=""
                          onError={() => setFailedAvatar(account.avatar)}
                        />
                      ) : null}
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
          </AccountSlot>
          {toolsEnd}
          <button
            ref={menuButton}
            type="button"
            className="cap-site-header-icon cap-site-header-menu"
            aria-label="Menu"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            aria-controls={`${id}-sheet`}
            // Without hydration the button opens the sheet with no script (invoker commands, Baseline
            // newly available); enhance() takes the click over, and where neither runs nothing breaks.
            {...(hydrate ? {} : { commandfor: `${id}-sheet`, command: "show-modal" })}
            onClick={() => setSheetOpen(true)}
          >
            {menuIcon}
          </button>
        </div>
        {letterhead && trail ? (
          <div className="cap-site-header-trail">
            <nav aria-label="You are here">
              <ol>
                {trail.crumbs.map((c) => (
                  <li key={c.label}>
                    {c.href && !c.current ? (
                      renderLink({ href: c.href, children: c.label })
                    ) : (
                      <span aria-current={c.current ? "page" : undefined}>{c.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            {trail.viewSite
              ? renderLink({
                  href: trail.viewSite,
                  className: "cap-site-header-view",
                  children: "View site",
                })
              : null}
          </div>
        ) : null}
        <Dialog
          open={sheetOpen}
          onOpenChange={(o) => !o && closeSheet()}
          placement="bottom"
          id={`${id}-sheet`}
          className="cap-site-header-sheet"
          aria-labelledby={`${id}-sheet-title`}
          initialFocus={sheetTitle}
        >
          <DialogHeader>
            <h2
              id={`${id}-sheet-title`}
              className="cap-dialog-title cap-site-header-sheet-title"
              ref={sheetTitle}
              tabIndex={-1}
            >
              {sheetName}
            </h2>
          </DialogHeader>
          <DialogBody>
            <nav aria-labelledby={`${id}-sheet-title`}>
              {part(props.sheetStart, closeSheet)}
              {switchers.map((s) =>
                s.groups.map((g, i) => (
                  <SheetGroup
                    key={`${s.id}-${i}`}
                    label={g.label ?? s.sheetLabel ?? s.label}
                    links={g.links}
                    renderLink={renderLink}
                    onClose={closeSheet}
                  />
                )),
              )}
              {sections
                .filter((s) => s.groups)
                .map((s) => (
                  <SheetGroup
                    key={s.id}
                    label={s.label}
                    links={(s.groups ?? []).flatMap((g) => g.links)}
                    renderLink={renderLink}
                    onClose={closeSheet}
                  />
                ))}
              {sectionLinks.length > 0 ? (
                <SheetGroup
                  label={linksLabel}
                  links={sectionLinks}
                  renderLink={renderLink}
                  onClose={closeSheet}
                />
              ) : null}
              {part(props.sheetEnd, closeSheet)}
              {cta?.href && cta.phone !== "bar"
                ? renderLink({
                    href: cta.href,
                    className: cta.className
                      ? `cap-site-header-sheet-cta ${cta.className}`
                      : "cap-site-header-sheet-cta",
                    onClick: closeSheet,
                    children: cta.label,
                  })
                : null}
            </nav>
          </DialogBody>
          {account || signIn ? (
            <nav className="cap-site-header-sheet-account" aria-label="Account">
              <ul className="cap-site-header-sheet-list">
                {account?.groups
                  ?.flatMap((g) => g.links)
                  .map((l) => (
                    <li key={l.label}>
                      {headerItem(
                        l,
                        <>
                          <span className="cap-site-header-sheet-icon" aria-hidden="true" />
                          <span className="cap-site-header-sheet-name">{l.label}</span>
                        </>,
                        renderLink,
                        { onClose: closeSheet },
                      )}
                    </li>
                  ))}
                {account && signOut ? (
                  <li>
                    {headerItem(
                      signOut,
                      <>
                        <span className="cap-site-header-sheet-icon" aria-hidden="true" />
                        <span className="cap-site-header-sheet-name">{signOutLabel}</span>
                      </>,
                      plainLink,
                      { onClose: closeSheet, disabled: account.signOutDisabled },
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
                          <span className="cap-site-header-sheet-name">
                            {signIn.label ?? "Sign in"}
                          </span>
                        </>
                      ),
                    })}
                  </li>
                ) : null}
              </ul>
            </nav>
          ) : null}
        </Dialog>
        {end}
      </header>
    </HeaderHydrates.Provider>
  );
}

// The account slot, last in the tools. A page with no sign-in at all (a personal site) renders none.
function AccountSlot({ show, children }: { show: boolean; children: ReactNode }) {
  return show ? <div className="cap-site-header-account">{children}</div> : null;
}

// The bottom bar of a signed-in area on a phone: up to five of its top pages, no More (the menu
// button opens the full list). Shown under 768px only. Put it last in the page, so it sticks to the
// window's bottom edge.
export function SiteTabs({
  tabs,
  label = "Sections",
  renderLink = plainLink,
}: {
  tabs: HeaderLink[];
  label?: string;
  renderLink?: (p: LinkProps) => ReactNode;
}) {
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
                  <span
                    className="cap-count cap-site-header-badge"
                    data-tone="need"
                    aria-hidden="true"
                  >
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
