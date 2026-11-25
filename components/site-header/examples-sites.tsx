// The specimen data for the site header: Foxhound's, Foxing's and the family letterhead's headers, their account menus and
// the pages under them (examples.tsx mounts them).
import {
  FIRST_PAGE,
  type AdminEntry,
  type AdminShellProps,
} from "../admin-shell/admin-shell.react.tsx";
import { type HeaderSection, type SiteHeaderProps } from "./site-header.react.tsx";

export const icon = (d: string, cls = "cap-admin-icon") => (
  <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
export const hd = (d: string) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
export const D = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5",
  stack: "M12 4 3 9l9 5 9-5zM3 14l9 5 9-5",
  share: "M8 12h8M14 7l5 5-5 5M5 5v14",
  clock: "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 8v4l3 2",
  gauge: "M4 17a8 8 0 1 1 16 0M12 17l4-5",
  store: "M4 9h16l-1-4H5zM5 9v11h14V9M9 20v-6h6v6",
  people:
    "M9 4.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4zM3 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5M16 5.2a3 3 0 0 1 0 5.6M18 15c1.6.6 2.6 2.2 3 5",
  hook: "M9 4v7a3 3 0 0 0 6 0M15 11V9M6 20h12M12 14v6",
  brake: "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 8v5M12 16v.5",
  book: "M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14",
  star: "m12 4 2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.2 7 19l1.2-5.6L4 9.6 9.6 9z",
  pen: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  bell: "M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0",
  search: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.2-3.2",
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
};

export const Hero = ({ title, lead }: { title: string; lead: string }) => (
  <main className="sh-hero" id="main" tabIndex={-1}>
    <h1>{title}</h1>
    <p className="sh-lead">{lead}</p>
    <div className="sh-filler" aria-hidden="true" />
  </main>
);
export const Tiles = ({
  tiles,
  rows,
}: {
  tiles: Array<[string, string, string]>;
  rows: Array<[string, string]>;
}) => (
  <div className="cap-admin-page">
    <h1>{FIRST_PAGE}</h1>
    <ul className="sh-tiles">
      {tiles.map(([label, value, note]) => (
        <li key={label}>
          <span>{label}</span>
          <b>{value}</b>
          <span>{note}</span>
        </li>
      ))}
    </ul>
    <ul className="sh-rows">
      {rows.map(([what, when]) => (
        <li key={what}>
          <span>{what}</span>
          <span>{when}</span>
        </li>
      ))}
    </ul>
  </div>
);

// The amber site: a dark band in both themes, section links on the right.
const FH_LOGO = {
  href: "#home",
  label: "Foxhound",
  wordmark: (
    <span className="sh-fh-wordmark" aria-hidden="true">
      fo<em>x</em>hound
    </span>
  ),
};
const fhSections: HeaderSection[] = [
  "Products",
  "Pricing",
  "Demos",
  "Features",
  "Docs",
  "Blog",
].map((label) => ({
  id: label.toLowerCase(),
  label,
  href: `#${label.toLowerCase()}`,
  current: label === "Pricing",
}));
export const fhPublic: SiteHeaderProps = {
  logo: FH_LOGO,
  band: "dark",
  links: "right",
  sections: fhSections,
  extras: [{ id: "audit", label: "Free audit", kind: "button", href: "#audit" }],
  signIn: { href: "#sign-in" },
  skipTo: "#main",
};

// A merchant's dashboard: the business as a square tile, then the product.
const fhAccount: Required<AdminShellProps>["account"] = {
  name: "Sam Rivera",
  initials: "SR",
  email: "sam@example.com",
  appLabel: "Acme Supply Co.",
  appLinks: [
    "Settings",
    "Billing",
    "Team",
    "Audit settings",
    "Audit history",
    "Email settings",
    "Alerts",
    "API keys",
    "Brand voice",
  ].map((l) => ({ label: l, href: `#${l.toLowerCase().replace(/ /g, "-")}` })),
  onSignOut: () => undefined,
};
export const fhDashboard: AdminShellProps = {
  variant: "user",
  title: "Foxhound",
  logo: FH_LOGO,
  band: "dark",
  switchers: [
    {
      id: "business",
      label: "Acme Supply Co.",
      name: "Business: Acme Supply Co.",
      tile: "A",
      sheetLabel: "Businesses",
      groups: [
        {
          label: "Businesses",
          links: [
            { label: "Acme Supply Co.", href: "#acme", current: true },
            { label: "Northwind Goods", href: "#northwind" },
          ],
        },
      ],
    },
    {
      id: "product",
      label: "Recovery",
      name: "Product: Recovery",
      sheetLabel: "Products",
      groups: [
        {
          label: "Products",
          links: ["Console", "Audit", "Recovery", "Disputes", "Intelligence"].map((p) => ({
            label: p,
            href: `#${p.toLowerCase()}`,
            current: p === "Recovery",
          })),
        },
      ],
    },
  ],
  account: fhAccount,
  onHelp: () => undefined,
  nav: [
    { id: "overview", label: FIRST_PAGE, href: "#overview", icon: icon(D.grid), current: true },
    { id: "payments", label: "Payments", href: "#payments", icon: icon(D.list), count: 12 },
    { id: "sequences", label: "Sequences", href: "#sequences", icon: icon(D.stack) },
    { id: "winback", label: "Win-back", href: "#win-back", icon: icon(D.share) },
    { id: "expiring", label: "Expiring cards", href: "#expiring", icon: icon(D.clock), count: 23 },
    { id: "settings", label: "Settings", href: "#settings", icon: icon(D.gauge), group: "Account" },
    { id: "billing", label: "Billing", href: "#billing", icon: icon(D.store), group: "Account" },
    { id: "team", label: "Team", href: "#team", icon: icon(D.people), group: "Account" },
  ],
  page: FIRST_PAGE,
  updated: { at: Date.now() - 2 * 60_000 },
  onRefresh: () => undefined,
  children: null,
};
export const ownerBase = (
  app: "foxhound" | "foxing" | "portal",
  nav: AdminEntry[],
): AdminShellProps => ({
  app,
  variant: "owner",
  badges: {
    portal: { count: 2 },
    carrel: { count: 3, countNote: "AI drafts waiting" },
    info: { count: 1 },
    ...(app === "foxhound" ? { foxing: { count: 1 } } : { foxhound: { count: 1 } }),
  },
  onSearch: () => undefined,
  inbox: { count: 4, href: "#inbox" },
  onHelp: () => undefined,
  viewSite: "#site",
  account: { role: "Owner", email: "owner@example.com", onSignOut: () => undefined },
  nav,
  page: FIRST_PAGE,
  updated: { at: Date.now() - 6 * 60_000 },
  onRefresh: () => undefined,
  children: null,
});
export const fhAdmin: AdminShellProps = {
  ...ownerBase("foxhound", [
    { id: "overview", label: FIRST_PAGE, href: "#overview", icon: icon(D.grid), current: true },
    {
      id: "merchants",
      label: "Merchants",
      href: "#merchants",
      icon: icon(D.store),
      group: "Customers",
    },
    { id: "users", label: "Users", href: "#users", icon: icon(D.people), group: "Customers" },
    {
      id: "operations",
      label: "Operations",
      href: "#operations",
      icon: icon(D.gauge),
      group: "Platform",
    },
    {
      id: "crons",
      label: "Crons",
      href: "#crons",
      icon: icon(D.clock),
      count: 1,
      countNote: "failing",
      tone: "need",
      group: "Platform",
    },
    { id: "webhooks", label: "Webhooks", href: "#webhooks", icon: icon(D.hook), group: "Platform" },
    {
      id: "brake",
      label: "Emergency brake",
      href: "#brake",
      icon: icon(D.brake),
      group: "Controls",
    },
    {
      id: "staged",
      label: "Staged changes",
      href: "#staged",
      icon: icon(D.stack),
      count: 2,
      group: "Controls",
    },
  ]),
  logo: FH_LOGO,
  band: "dark",
};

export const FH_TILES: Array<[string, string, string]> = [
  ["Recovered this month", "$8,214", "62 payments"],
  ["Recovery rate", "41%", "of failed charges"],
  ["In sequence", "118", "retrying now"],
  ["Cards expiring", "23", "next 30 days"],
];
export const FH_ROWS: Array<[string, string]> = [
  ["Payment from j.ortiz@example.com failed its third retry", "12 minutes ago"],
  ["Win-back email opened by 14 customers", "today"],
  ["Sequence Card declined sent 31 emails", "yesterday"],
];
export const FX_TILES: Array<[string, string, string]> = [
  ["Readers", "1,284", "38 new this week"],
  ["Books", "9,402", "in the catalog"],
  ["Clubs", "57", "12 meeting this week"],
  ["Journal", "2", "drafts waiting"],
];
export const FX_ROWS: Array<[string, string]> = [
  ["A reader reported a review", "40 minutes ago"],
  ["Book of the Month for November not set", "today"],
  ["Journal draft: Ten books for long nights", "yesterday"],
];
