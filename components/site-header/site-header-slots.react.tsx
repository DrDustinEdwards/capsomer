// The site header's pure render helpers, no state of their own: an extra control, the logo link and the account menu's rows
// (site-header.react.tsx lays them out).
import { Fragment } from "react";
import { plainLink } from "../hooks/hooks.react.tsx";
import {
  HeaderTip,
  countName,
  headerItem,
  type HeaderAccount,
  type HeaderExtra,
  type HeaderGroup,
  type HeaderLogo,
  type SiteHeaderProps,
} from "./site-header-parts.react.tsx";
import { badgeText } from "./site-header.ts";

type RenderLink = NonNullable<SiteHeaderProps["renderLink"]>;
type RowItem = Parameters<typeof headerItem>[0];

export function renderExtra(e: HeaderExtra, renderLink: RenderLink) {
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
}

export function renderLogo(logo: HeaderLogo, letterhead: boolean, renderLink: RenderLink) {
  return renderLink({
    href: logo.href,
    className: logo.className ? `cap-site-header-logo ${logo.className}` : "cap-site-header-logo",
    "aria-label":
      logo.name ??
      (letterhead ? [logo.agency, logo.label, logo.app].filter(Boolean).join(" ") : logo.label),
    children: (
      <>
        {logo.mark}
        {letterhead ? (
          <span className="cap-site-header-names" aria-hidden="true">
            {logo.agency ? <span className="cap-site-header-agency">{logo.agency}</span> : null}
            {/* A space, so the visible text matches the accessible name (WCAG 2.5.3). */}
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
  });
}

export function accountPanelOf(
  account: HeaderAccount,
  panelGroups: HeaderGroup[],
  signOut: RowItem | undefined,
  renderLink: RenderLink,
) {
  return (
    account.panel ?? (
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
                {/* Plain link: Sign out leaves the app, so it is a full load, never the router's. */}
                {headerItem(signOut, "Sign out", plainLink, {
                  disabled: account.signOutDisabled,
                })}
              </li>
            </ul>
          </>
        ) : null}
      </>
    )
  );
}

export function renderTrail(trail: NonNullable<SiteHeaderProps["trail"]>, renderLink: RenderLink) {
  return (
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
  );
}

export function signOutRow(account: HeaderAccount): RowItem | undefined {
  if (account.signOutHref) return { label: "Sign out", href: account.signOutHref };
  if (account.signOutAction)
    return { label: "Sign out", action: account.signOutAction, fields: account.signOutFields };
  if (account.onSignOut) return { label: "Sign out", onClick: account.onSignOut };
  return undefined;
}
