import { Fragment, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import type { LinkProps } from "../shell/shell.react.tsx";
import { ThemeButton, ThemeForm } from "../theme-switch/theme-switch.react.tsx";
import { enhance as enhanceTheme, THEME_PREF } from "../theme-switch/theme-switch.ts";
import {
  CHEV,
  Disclosure,
  GroupList,
  HeaderHydrates,
  type HeaderLink,
  HeaderTip,
  MENU_ICON,
  PERSON_ICON,
  SEARCH_ICON,
  type SiteHeaderProps,
  countName,
} from "./site-header-parts.react.tsx";
import {
  badgeText,
  guardForms,
  wireScrolled,
  wireSearchOnDemand,
  wireThemeKey,
} from "./site-header.ts";
import { plainLink } from "../hooks/hooks.react.tsx";
import { HeaderSheet } from "./site-header-sheet.react.tsx";
import {
  accountPanelOf,
  renderExtra,
  renderLogo,
  renderTrail,
  signOutRow,
} from "./site-header-slots.react.tsx";

export { countName, HeaderTip, SheetGroup } from "./site-header-parts.react.tsx";
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
    return wireSearchOnDemand(searchBox.current, suggest);
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
  const signOut = account ? signOutRow(account) : undefined;

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

  const accountPanel = account ? accountPanelOf(account, panelGroups, signOut, renderLink) : null;

  const sectionLinks = sections
    .filter((s) => !s.groups && !s.panel && s.href)
    .map((s): HeaderLink => ({ id: s.id, label: s.label, href: s.href!, current: s.current }));
  // A letterhead with section links keeps them in its own row at every width (they swipe on a phone), so it
  // has no menu button and no sheet; the sheet is for the default header and the letterhead's admin.
  const sheet = !(letterhead && sections.length > 0);
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
        {renderLogo(logo, letterhead, renderLink)}
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
          {ownSearch ? renderExtra(ownSearch, renderLink) : null}
          {icons.length > 0 || cta ? (
            // data-phone="bar": the button extra stays in the phone's top row.
            <div className="cap-site-header-extras" data-phone={cta?.phone}>
              {icons.map((e) => renderExtra(e, renderLink))}
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
          {sheet ? (
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
          ) : null}
        </div>
        {letterhead && trail ? renderTrail(trail, renderLink) : null}
        {sheet ? (
          <HeaderSheet
            id={id}
            open={sheetOpen}
            closeSheet={closeSheet}
            titleRef={sheetTitle}
            title={sheetName}
            start={props.sheetStart}
            end={props.sheetEnd}
            switchers={switchers}
            sections={sections}
            sectionLinks={sectionLinks}
            linksLabel={linksLabel}
            cta={cta}
            account={account}
            signIn={signIn}
            signOut={signOut}
            signOutLabel={signOutLabel}
            renderLink={renderLink}
          />
        ) : null}
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
