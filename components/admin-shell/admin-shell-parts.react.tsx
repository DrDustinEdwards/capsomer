import { useEffect, useRef } from "react";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";
import { countName as headerCountName, TipKeys } from "../site-header/site-header-parts.react.tsx";
import { badgeText } from "./admin-shell.ts";
import { FAMILY_APPS, type FamilyAppId } from "./apps.tsx";
import type { AdminApp, AdminShellProps } from "./admin-shell-types.ts";

export const Icon = ({ d }: { d: string }) => (
  <svg className="cap-admin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
// The header's glyphs are the 24-box, 1.6-stroke family the header draws at 18px.
export const HeaderIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);

export const COLLAPSE_D = "M3 4h18v16H3zM9 4v16M16 10l-2 2 2 2";
export const EXPAND_D = "M3 4h18v16H3zM9 4v16M14 10l2 2-2 2";
export const SEARCH_D = "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM21 21l-5-5";
export const INBOX_D = "M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6z";
export const REFRESH_D = "M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5";

export const countName = (label: string, count?: number, note?: string) =>
  count ? headerCountName(label, count, note) : undefined;

// A control's name, shown beside it on hover and keyboard focus: Capsomer's one tooltip (the
// shared popover's tooltip variant, in the top layer, so it is above every panel, tile and
// badge). It is a child of its control and attaches to it; keys are key caps ("G", "2").
// `describe` false leaves the control's description alone, where the tip repeats its name.
// `offset` clears what sits beside the control: a strip tip starts past the strip's edge (and so
// past the control's own badge), a menu tip past the menu's.
export function Tip({
  text,
  keys,
  side = "right",
  offset = 20,
  describe = true,
}: {
  text: string;
  keys?: string;
  side?: "right" | "bottom";
  offset?: number;
  describe?: boolean;
}) {
  const tip = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = tip.current;
    const trigger = el?.parentElement;
    if (!el || !trigger) return;
    const detach = attachTip(trigger, el);
    if (!describe) trigger.removeAttribute("aria-describedby");
    // A control that is used (a click or Enter) has done what its name said: the name goes, so
    // it does not sit over the panel or page the control opened.
    const used = () => hideTip(trigger);
    trigger.addEventListener("click", used);
    return () => {
      trigger.removeEventListener("click", used);
      detach();
    };
  }, [describe]);
  return (
    <span
      ref={tip}
      className="cap-admin-tip cap-popover"
      data-variant="tooltip"
      data-side={side}
      data-offset={offset}
      popover="manual"
      role="tooltip"
      aria-hidden="true"
    >
      <span className="cap-admin-tip-text">{text}</span>
      <TipKeys keys={keys} />
    </span>
  );
}

// The strip: the family's apps in their one order, this one marked, others with their badges.
export function stripApps(
  app: FamilyAppId | undefined,
  badges: AdminShellProps["badges"],
  apps: AdminApp[] | undefined,
): AdminApp[] {
  if (apps) return apps;
  return FAMILY_APPS.map((a) => ({
    ...badges?.[a.id],
    id: a.id,
    label: a.label,
    href: a.href,
    logo: a.logo,
    current: a.id === app,
  }));
}

export const Badge = ({ count }: { count?: number }) =>
  count ? (
    <span className="cap-count cap-admin-badge" data-tone="need" aria-hidden="true">
      {badgeText(count)}
    </span>
  ) : null;

export const mark = (a: AdminApp) =>
  a.logo ?? <span aria-hidden="true">{a.mono ?? a.label.slice(0, 1)}</span>;
