// The site header's sheet: the menu a phone opens, its groups, the section links and the account rows
// (site-header.react.tsx opens and closes it).
import type { ReactNode, RefObject } from "react";
import { Dialog, DialogBody, DialogHeader } from "../dialog/dialog.react.tsx";
import { plainLink } from "../hooks/hooks.react.tsx";
import {
  SheetGroup,
  headerItem,
  part,
  type HeaderAccount,
  type HeaderExtra,
  type HeaderLink,
  type HeaderSection,
  type HeaderSwitcher,
  type SheetPart,
  type SiteHeaderProps,
} from "./site-header-parts.react.tsx";

type RenderLink = NonNullable<SiteHeaderProps["renderLink"]>;

export function HeaderSheet({
  id,
  open,
  closeSheet,
  titleRef,
  title,
  start,
  end,
  switchers,
  sections,
  sectionLinks,
  linksLabel,
  cta,
  account,
  signIn,
  signOut,
  signOutLabel,
  renderLink,
}: {
  id: string;
  open: boolean;
  closeSheet: () => void;
  titleRef: RefObject<HTMLHeadingElement | null>;
  title: string;
  start?: SheetPart;
  end?: SheetPart;
  switchers: HeaderSwitcher[];
  sections: HeaderSection[];
  sectionLinks: HeaderLink[];
  linksLabel: string | undefined;
  cta: HeaderExtra | undefined;
  account: HeaderAccount | undefined;
  signIn: SiteHeaderProps["signIn"];
  signOut: Parameters<typeof headerItem>[0] | undefined;
  signOutLabel: string;
  renderLink: RenderLink;
}): ReactNode {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && closeSheet()}
      placement="bottom"
      id={`${id}-sheet`}
      className="cap-site-header-sheet"
      aria-labelledby={`${id}-sheet-title`}
      initialFocus={titleRef}
    >
      <DialogHeader>
        <h2
          id={`${id}-sheet-title`}
          className="cap-dialog-title cap-site-header-sheet-title"
          ref={titleRef}
          tabIndex={-1}
        >
          {title}
        </h2>
      </DialogHeader>
      <DialogBody>
        <nav aria-labelledby={`${id}-sheet-title`}>
          {part(start, closeSheet)}
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
          {part(end, closeSheet)}
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
  );
}
