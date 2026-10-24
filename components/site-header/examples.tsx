// Mounts the site header specimens. Every element with data-mount="<surface>" gets that surface:
// a teal site with a dark band (Foxhound's look) and a fox site with a translucent band (Foxing's),
// each as a public page, a signed-in page or a user's dashboard, and your admin. The phone
// specimens mount the same surfaces in a 390px frame. Names, numbers and accounts are samples.
import { StrictMode, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AdminShell, FAMILY_APPS, FIRST_PAGE, type AdminEntry, type AdminShellProps } from "../admin-shell/admin-shell.react.tsx";
import { SiteHeader, SiteTabs, type HeaderAccount, type HeaderSection, type SiteHeaderProps } from "./site-header.react.tsx";

const icon = (d: string, cls = "cap-admin-icon") => (
  <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
const hd = (d: string) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
const D = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5",
  stack: "M12 4 3 9l9 5 9-5zM3 14l9 5 9-5",
  share: "M8 12h8M14 7l5 5-5 5M5 5v14",
  clock: "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 8v4l3 2",
  gauge: "M4 17a8 8 0 1 1 16 0M12 17l4-5",
  store: "M4 9h16l-1-4H5zM5 9v11h14V9M9 20v-6h6v6",
  people: "M9 4.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4zM3 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5M16 5.2a3 3 0 0 1 0 5.6M18 15c1.6.6 2.6 2.2 3 5",
  hook: "M9 4v7a3 3 0 0 0 6 0M15 11V9M6 20h12M12 14v6",
  brake: "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 8v5M12 16v.5",
  book: "M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14",
  star: "m12 4 2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.2 7 19l1.2-5.6L4 9.6 9.6 9z",
  pen: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  bell: "M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0",
  search: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.2-3.2",
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
};

// The page under each header: a hero for a public page, tiles and rows for a signed-in one.
const Hero = ({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) => (
  <main className="sh-hero" id="main" tabIndex={-1}>
    <p className="sh-eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p className="sh-lead">{lead}</p>
    <div className="sh-filler" aria-hidden="true" />
  </main>
);
const Tiles = ({ tiles, rows }: { tiles: Array<[string, string, string]>; rows: Array<[string, string]> }) => (
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

// The teal site: Foxhound's look, its wordmark in the mono face with the x in the accent, on a band
// that is dark in both themes, its section links on the right before a thin divider.
const FH_LOGO = { href: "#home", label: "Foxhound", wordmark: <span className="sh-fh-wordmark" aria-hidden="true">fo<em>x</em>hound</span> };
const fhSections: HeaderSection[] = ["Products", "Pricing", "Demos", "Features", "Docs", "Blog"].map((label) => ({ id: label.toLowerCase(), label, href: `#${label.toLowerCase()}`, current: label === "Pricing" }));
const fhPublic: SiteHeaderProps = {
  logo: FH_LOGO,
  band: "dark",
  links: "right",
  sections: fhSections,
  extras: [{ id: "audit", label: "Free audit", kind: "button", href: "#audit" }],
  signIn: { href: "#sign-in" },
  skipTo: "#main",
};

// A merchant's dashboard: the business as a square tile, then the product; the gear is gone and
// its rows are in the avatar's menu, under the business's name.
const fhAccount: Required<AdminShellProps>["account"] = {
  name: "Sam Rivera",
  initials: "SR",
  email: "sam@example.com",
  appLabel: "Acme Supply Co.",
  appLinks: ["Settings", "Billing", "Team", "Audit settings", "Audit history", "Email settings", "Alerts", "API keys", "Brand voice"].map((l) => ({ label: l, href: `#${l.toLowerCase().replace(/ /g, "-")}` })),
  onSignOut: () => undefined,
};
const fhDashboard: AdminShellProps = {
  variant: "user",
  title: "Foxhound",
  logo: FH_LOGO,
  band: "dark",
  switchers: [
    { id: "business", label: "Acme Supply Co.", name: "Business: Acme Supply Co.", tile: "A", sheetLabel: "Businesses", groups: [{ label: "Businesses", links: [{ label: "Acme Supply Co.", href: "#acme", current: true }, { label: "Northwind Goods", href: "#northwind" }] }] },
    { id: "product", label: "Recovery", name: "Product: Recovery", sheetLabel: "Products", groups: [{ label: "Products", links: ["Console", "Audit", "Recovery", "Disputes", "Intelligence"].map((p) => ({ label: p, href: `#${p.toLowerCase()}`, current: p === "Recovery" })) }] },
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
const ownerBase = (app: "foxhound" | "foxing", nav: AdminEntry[]): AdminShellProps => ({
  app,
  variant: "owner",
  badges: { portal: { count: 2 }, carrel: { count: 3, countNote: "AI drafts waiting" }, info: { count: 1 }, ...(app === "foxhound" ? { foxing: { count: 1 } } : { foxhound: { count: 1 } }) },
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
const fhAdmin: AdminShellProps = {
  ...ownerBase("foxhound", [
    { id: "overview", label: FIRST_PAGE, href: "#overview", icon: icon(D.grid), current: true },
    { id: "merchants", label: "Merchants", href: "#merchants", icon: icon(D.store), group: "Customers" },
    { id: "users", label: "Users", href: "#users", icon: icon(D.people), group: "Customers" },
    { id: "operations", label: "Operations", href: "#operations", icon: icon(D.gauge), group: "Platform" },
    { id: "crons", label: "Crons", href: "#crons", icon: icon(D.clock), count: 1, countNote: "failing", tone: "need", group: "Platform" },
    { id: "webhooks", label: "Webhooks", href: "#webhooks", icon: icon(D.hook), group: "Platform" },
    { id: "brake", label: "Emergency brake", href: "#brake", icon: icon(D.brake), group: "Controls" },
    { id: "staged", label: "Staged changes", href: "#staged", icon: icon(D.stack), count: 2, group: "Controls" },
  ]),
  logo: FH_LOGO,
  band: "dark",
};

// The fox site: Foxing's look, its placeholder mark and its name in the serif, a translucent band
// in the page's ground, its section links centred. Books and Celebrity Picks open Foxing's own
// panels, laid out as Foxing draws them.
const FOX_MARK = FAMILY_APPS.find((a) => a.id === "foxing")?.logo;
const FX_LOGO = { href: "#home", label: "Foxing", mark: FOX_MARK, wordmark: <span className="sh-fx-wordmark" aria-hidden="true">Foxing</span> };
const booksPanel = (
  <div className="sh-mega">
    <div>
      <p className="sh-mega-label">Browse</p>
      <ul>
        <li>
          <a href="#books">All books</a>
        </li>
        <li>
          <a href="#awards">Award winners</a>
        </li>
      </ul>
    </div>
    <div>
      <p className="sh-mega-label">By era</p>
      <ul className="sh-chips">
        {["Before 1800", "1800 to 1899", "1900 to 1949", "1950 and later"].map((e) => (
          <li key={e}>
            <a href={`#era-${e.slice(0, 4)}`}>{e}</a>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
const picksPanel = (
  <div className="sh-mega" data-cols="1">
    <a className="sh-pick" href="#pick">
      <span className="sh-mega-label">Foxing pick</span>
      <b>The Lantern Keeper</b>
      <span>A. N. Sample</span>
    </a>
    <p className="sh-mega-label">Featured clubs</p>
    <ul data-cols="2">
      {["Morning Readers", "The Long Shelf", "Second Chapter", "Night Owls"].map((c) => (
        <li key={c}>
          <a href={`#club-${c.length}`}>{c}</a>
        </li>
      ))}
    </ul>
  </div>
);
const fxSections: HeaderSection[] = [
  { id: "books", label: "Books", current: true, panel: booksPanel, groups: [{ links: [{ label: "All books", href: "#books" }, { label: "Award winners", href: "#awards" }] }] },
  { id: "picks", label: "Celebrity Picks", panel: picksPanel, groups: [{ links: [{ label: "This month's pick", href: "#pick" }, { label: "All picks", href: "#picks" }] }] },
  { id: "clubs", label: "Clubs", href: "#clubs" },
  { id: "people", label: "People", href: "#people" },
  { id: "journal", label: "Journal", href: "#journal" },
];
const fxSearch = { id: "search", label: "Search", icon: hd(D.search), onClick: () => undefined, keys: "/" };
const fxPublic: SiteHeaderProps = {
  logo: FX_LOGO,
  translucent: true,
  links: "center",
  sections: fxSections,
  extras: [fxSearch, { id: "join", label: "Join free", kind: "button", href: "#join" }],
  signIn: { href: "#sign-in" },
  skipTo: "#main",
  // The site binds single keys, so T switches the theme.
  themeKey: "t",
};
// Signed in: the bell joins Search, the avatar is the reader's picture, and its menu is Foxing's own panel.
const fxAccount: HeaderAccount = {
  name: "Sam Rivera",
  initials: "SR",
  // A picture, drawn over the initials (a sample: a fox-orange head and shoulders).
  avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Crect width='8' height='8' fill='%23f5c9a8'/%3E%3Ccircle cx='4' cy='3' r='1.6' fill='%23b64404'/%3E%3Cpath d='M1 8a3 3 0 0 1 6 0z' fill='%23b64404'/%3E%3C/svg%3E",
  groups: [{ links: ["Reading stats", "Library", "Diary", "Profile", "Settings"].map((l) => ({ label: l, href: `#${l.toLowerCase().replace(/ /g, "-")}` })) }],
  onSignOut: () => undefined,
  panel: (
    <div className="sh-fx-account">
      <div className="sh-fx-id">
        <b>Sam Rivera</b>
        <span>@samreads</span>
      </div>
      <dl>
        <div>
          <dd>14</dd>
          <dt>books this year</dt>
        </div>
        <div>
          <dd>6</dd>
          <dt>day streak</dt>
        </div>
        <div>
          <dd>212</dd>
          <dt>highlights</dt>
        </div>
      </dl>
      <ul>
        {["Reading stats", "Library", "Diary", "Profile", "Settings"].map((l) => (
          <li key={l}>
            <a href={`#${l.toLowerCase().replace(/ /g, "-")}`}>{l}</a>
          </li>
        ))}
        <li>
          <button type="button" data-panel-close="">
            Sign out
          </button>
        </li>
      </ul>
    </div>
  ),
};
const fxReader: SiteHeaderProps = {
  ...fxPublic,
  sections: fxSections.map((s) => ({ ...s, current: false })),
  extras: [fxSearch, { id: "bell", label: "Notifications", icon: hd(D.bell), href: "#notifications", count: 3, countNote: "new" }],
  signIn: undefined,
  account: fxAccount,
};
const fxTabs = [
  { label: "Home", href: "#home", icon: hd(D.home), current: true },
  { label: "Library", href: "#library", icon: hd(D.book) },
  { label: "Diary", href: "#diary", icon: hd(D.pen) },
  { label: "Feed", href: "#feed", icon: hd(D.list) },
  { label: "People", href: "#people", icon: hd(D.people) },
];
const fxAdmin: AdminShellProps = {
  ...ownerBase("foxing", [
    { id: "overview", label: FIRST_PAGE, href: "#overview", icon: icon(D.grid), current: true },
    { id: "books", label: "Books", href: "#books", icon: icon(D.book), group: "Catalog" },
    { id: "picks", label: "Picks", href: "#picks", icon: icon(D.star), group: "Catalog" },
    { id: "clubs", label: "Clubs", href: "#clubs", icon: icon(D.people), group: "Catalog" },
    { id: "journal", label: "Journal", href: "#journal", icon: icon(D.pen), count: 2, countNote: "drafts", group: "Content" },
    { id: "notifications", label: "Notifications", href: "#notifications", icon: icon(D.bell), group: "Content" },
    { id: "users", label: "Users", href: "#users", icon: icon(D.people), count: 1, countNote: "reported", tone: "need", group: "People" },
  ]),
  logo: FX_LOGO,
  translucent: true,
};

const FH_TILES: Array<[string, string, string]> = [
  ["Recovered this month", "$8,214", "62 payments"],
  ["Recovery rate", "41%", "of failed charges"],
  ["In sequence", "118", "retrying now"],
  ["Cards expiring", "23", "next 30 days"],
];
const FH_ROWS: Array<[string, string]> = [
  ["Payment from j.ortiz@example.com failed its third retry", "12 minutes ago"],
  ["Win-back email opened by 14 customers", "today"],
  ["Sequence Card declined sent 31 emails", "yesterday"],
];
const FX_TILES: Array<[string, string, string]> = [
  ["Readers", "1,284", "38 new this week"],
  ["Books", "9,402", "in the catalog"],
  ["Clubs", "57", "12 meeting this week"],
  ["Journal", "2", "drafts waiting"],
];
const FX_ROWS: Array<[string, string]> = [
  ["A reader reported a review", "40 minutes ago"],
  ["Book of the Month for November not set", "today"],
  ["Journal draft: Ten books for long nights", "yesterday"],
];

// Holds a panel or the sheet open for the picture; the spec checks the real hover, click and keys.
function Hold({ press, children }: { press?: string; children: ReactNode }) {
  useEffect(() => {
    if (!press) return;
    // A pointer's click (detail 1), so the picture shows the panel without a keyboard's focus ring.
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>(press)?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })));
    return () => cancelAnimationFrame(frame);
  }, [press]);
  return <>{children}</>;
}

const Site = ({ family, children }: { family: "teal" | "fox"; children: ReactNode }) => (
  <div className="sh-site" data-family={family}>
    {children}
  </div>
);

const admin = (p: AdminShellProps, key: string, tiles: Array<[string, string, string]>, rows: Array<[string, string]>) => (
  <AdminShell {...p} prefKey={`cap-site-header-specimen-${key}`}>
    <Tiles tiles={tiles} rows={rows} />
  </AdminShell>
);

const SURFACES: Record<string, () => ReactNode> = {
  "fh-public": () => (
    <Site family="teal">
      <SiteHeader {...fhPublic} />
      <Hero eyebrow="Revenue recovery for Stripe" title="Get back the payments your customers meant to make." lead="Foxhound retries failed charges at the right moment and writes the emails that bring card holders back." />
    </Site>
  ),
  "fh-dashboard": () => <Site family="teal">{admin(fhDashboard, "fh-dashboard", FH_TILES, FH_ROWS)}</Site>,
  "fh-dashboard-account": () => (
    <Site family="teal">
      <Hold press=".cap-site-header-avatar">{admin(fhDashboard, "fh-dashboard-account", FH_TILES, FH_ROWS)}</Hold>
    </Site>
  ),
  "fh-dashboard-switcher": () => (
    <Site family="teal">
      <Hold press=".cap-site-header-switch">{admin(fhDashboard, "fh-dashboard-switcher", FH_TILES, FH_ROWS)}</Hold>
    </Site>
  ),
  "fh-admin": () => <Site family="teal">{admin(fhAdmin, "fh-admin", FH_TILES, FH_ROWS)}</Site>,
  "fx-public": () => (
    <Site family="fox">
      <SiteHeader {...fxPublic} />
      <Hero eyebrow="Book of the month" title="Find the next book you cannot put down." lead="Picks from readers you trust, clubs that actually meet, and a diary that remembers every page." />
    </Site>
  ),
  "fx-books": () => (
    <Site family="fox">
      <Hold press=".cap-site-header-sections .cap-site-header-link">
        <SiteHeader {...fxPublic} />
        <Hero eyebrow="Book of the month" title="Find the next book you cannot put down." lead="Picks from readers you trust, clubs that actually meet, and a diary that remembers every page." />
      </Hold>
    </Site>
  ),
  "fx-reader": () => (
    <Site family="fox">
      <SiteHeader {...fxReader} />
      <main className="sh-hero" id="main" tabIndex={-1}>
        <h1>Good evening, Sam</h1>
        <ul className="sh-tiles">
          {[
            ["Reading now", "2", "books"],
            ["This year", "14", "of 30 goal"],
            ["Streak", "6", "days"],
            ["Club meets", "Thu", "7:00 pm"],
          ].map(([a, b, c]) => (
            <li key={a}>
              <span>{a}</span>
              <b>{b}</b>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <div className="sh-filler" aria-hidden="true" />
      </main>
      <SiteTabs tabs={fxTabs} label="Your reading" />
    </Site>
  ),
  "fx-reader-account": () => (
    <Site family="fox">
      <Hold press=".cap-site-header-avatar">
        <SiteHeader {...fxReader} />
        <main className="sh-hero" id="main" tabIndex={-1}>
          <h1>Good evening, Sam</h1>
          <div className="sh-filler" aria-hidden="true" />
        </main>
      </Hold>
    </Site>
  ),
  "fx-admin": () => <Site family="fox">{admin(fxAdmin, "fx-admin", FX_TILES, FX_ROWS)}</Site>,
  "fx-sheet": () => (
    <Site family="fox">
      <Hold press=".cap-site-header-menu">
        <SiteHeader {...fxPublic} />
        <Hero eyebrow="Book of the month" title="Find the next book you cannot put down." lead="Picks from readers you trust, clubs that actually meet, and a diary that remembers every page." />
      </Hold>
    </Site>
  ),
  "fh-sheet": () => (
    <Site family="teal">
      <Hold press=".cap-site-header-menu">{admin(fhDashboard, "fh-sheet", FH_TILES, FH_ROWS)}</Hold>
    </Site>
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SURFACES[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
