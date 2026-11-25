// Mounts the site header specimens: each element with data-mount="<surface>" gets that surface.
// Names, numbers and accounts are samples.
import { StrictMode, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { initials } from "../avatar/avatar.ts";
import { enhance as enhanceTheme } from "../theme-switch/theme-switch.ts";
import { setStaticHtml } from "../trusted-html/trusted-html.ts";
import { enhance } from "./site-header.ts";
import { AdminShell, FIRST_PAGE, type AdminShellProps } from "../admin-shell/admin-shell.react.tsx";
import { SiteHeader, SiteTabs, type SiteHeaderProps } from "./site-header.react.tsx";
import {
  icon,
  D,
  Hero,
  Tiles,
  fhDashboard,
  fhPublic,
  ownerBase,
  fhAdmin,
  FH_TILES,
  FH_ROWS,
  FX_TILES,
  FX_ROWS,
} from "./examples-sites.tsx";
import { fxAdmin, fxPublic, fxReader, fxTabs } from "./examples-foxing.tsx";

// Holds a panel or the sheet open for the picture.
function Hold({ press, children }: { press?: string; children: ReactNode }) {
  useEffect(() => {
    if (!press) return;
    // A pointer click (detail 1), so no keyboard focus ring shows.
    const frame = requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(press)
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })),
    );
    return () => cancelAnimationFrame(frame);
  }, [press]);
  return <>{children}</>;
}

// The family letterhead: a public page and an admin, with search and theme in the same places.
const HEX = (
  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" style={{ fill: "var(--on)" }}>
    <path d="M10 1 17.8 5.5v9L10 19l-7.8-4.5v-9z" />
  </svg>
);
// Search answers from a short list here.
const PAGES = ["Systems", "Flows", "Tools", "Numbers", "Code", "Backups", "Sessions"];
const lhSearch = {
  action: "#search",
  label: "Search Capsid",
  suggest: (q: string) =>
    PAGES.filter((p) => p.toLowerCase().includes(q.toLowerCase())).map((p) => ({
      url: `#${p.toLowerCase()}`,
      title: p,
      kind: "Page",
      detail: `Every ${p.toLowerCase()} on the site`,
    })),
};
const lhPublic: SiteHeaderProps = {
  variant: "letterhead",
  logo: { href: "#home", label: "Capsid", agency: "Dustin Edwards", mark: HEX },
  sections: ["Home", "Systems", "Flows", "Tools", "Numbers", "Code"].map((label, i) => ({
    id: label.toLowerCase(),
    label,
    href: `#${label.toLowerCase()}`,
    current: i === 0,
  })),
  search: lhSearch,
  skipTo: "#main",
};
const lhAdmin: AdminShellProps = {
  ...ownerBase("portal", [
    {
      id: "overview",
      label: FIRST_PAGE,
      href: "#overview",
      icon: icon(D.grid),
      current: true,
      group: "Watch",
    },
    { id: "queue", label: "Queue", href: "#queue", icon: icon(D.list), count: 5, group: "Work" },
  ]),
  letterhead: true,
  search: lhSearch,
  logo: { href: "#home", label: "Capsid", agency: "Dustin Edwards", app: "Portal", mark: HEX },
};

const Site = ({ family, children }: { family: "amber" | "fox" | "teal"; children: ReactNode }) => (
  <div className="sh-site" data-family={family}>
    {children}
  </div>
);

const admin = (
  p: AdminShellProps,
  key: string,
  tiles: Array<[string, string, string]>,
  rows: Array<[string, string]>,
) => (
  <AdminShell {...p} prefKey={`cap-site-header-specimen-${key}`}>
    <Tiles tiles={tiles} rows={rows} />
  </AdminShell>
);

const SURFACES: Record<string, () => ReactNode> = {
  "lh-public": () => (
    <Site family="teal">
      <SiteHeader {...lhPublic} />
      <Hero
        title="AI agents say it's done. Capsid checks."
        lead="A public page under the family letterhead: the names beside the mark, the links in a second row."
      />
    </Site>
  ),
  "lh-admin": () => <Site family="teal">{admin(lhAdmin, "lh-admin", FH_TILES, FH_ROWS)}</Site>,
  "fh-public": () => (
    <Site family="amber">
      <SiteHeader {...fhPublic} />
      <Hero
        title="Get back the payments your customers meant to make."
        lead="Foxhound retries failed charges at the right moment and writes the emails that bring card holders back."
      />
    </Site>
  ),
  "fh-dashboard": () => (
    <Site family="amber">{admin(fhDashboard, "fh-dashboard", FH_TILES, FH_ROWS)}</Site>
  ),
  "fh-dashboard-account": () => (
    <Site family="amber">
      <Hold press=".cap-site-header-avatar">
        {admin(fhDashboard, "fh-dashboard-account", FH_TILES, FH_ROWS)}
      </Hold>
    </Site>
  ),
  "fh-dashboard-switcher": () => (
    <Site family="amber">
      <Hold press=".cap-site-header-switch">
        {admin(fhDashboard, "fh-dashboard-switcher", FH_TILES, FH_ROWS)}
      </Hold>
    </Site>
  ),
  "fh-admin": () => <Site family="amber">{admin(fhAdmin, "fh-admin", FH_TILES, FH_ROWS)}</Site>,
  "fx-public": () => (
    <Site family="fox">
      <SiteHeader {...fxPublic} />
      <Hero
        title="Find the next book you cannot put down."
        lead="Picks from readers you trust, clubs that actually meet, and a diary that remembers every page."
      />
    </Site>
  ),
  "fx-rest-clear": () => (
    <Site family="fox">
      <SiteHeader {...fxPublic} rest="clear" />
      <Hero
        title="Find the next book you cannot put down."
        lead="Picks from readers you trust, clubs that actually meet, and a diary that remembers every page."
      />
      <div className="sh-filler" aria-hidden="true" />
    </Site>
  ),
  "fx-books": () => (
    <Site family="fox">
      <Hold press=".cap-site-header-sections .cap-site-header-link">
        <SiteHeader {...fxPublic} />
        <Hero
          title="Find the next book you cannot put down."
          lead="Picks from readers you trust, clubs that actually meet, and a diary that remembers every page."
        />
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
        <Hero
          title="Find the next book you cannot put down."
          lead="Picks from readers you trust, clubs that actually meet, and a diary that remembers every page."
        />
      </Hold>
    </Site>
  ),
  "fh-sheet": () => (
    <Site family="amber">
      <Hold press=".cap-site-header-menu">{admin(fhDashboard, "fh-sheet", FH_TILES, FH_ROWS)}</Hold>
    </Site>
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SURFACES[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}

// A page that does not hydrate: rendered once to HTML, then wired by the behavior modules alone.
const tile = (letter: string) => (
  <span className="sh-ex-tile" aria-hidden="true">
    {letter}
  </span>
);
const TOPICS: Array<[string, string]> = [
  ["Getting started", "Set up in an afternoon, with the three steps that matter."],
  ["Field notes", "What we learned on the way, written up each week."],
  ["Release notes", "Every change, in the order it shipped."],
];
const staticHeader: SiteHeaderProps = {
  hydrate: false,
  logo: { href: "#home", label: "Example Press" },
  links: "center",
  switchers: [
    {
      id: "workspace",
      label: "Example Press",
      name: "Switch workspace: Example Press",
      tile: "E",
      sheetLabel: "Workspaces",
      groups: [
        {
          label: "Workspaces",
          links: [
            {
              id: "w1",
              label: "Example Press",
              action: "#switch",
              fields: { workspace: "w1" },
              current: true,
              icon: tile("E"),
            },
            {
              id: "w2",
              label: "Field Office",
              action: "#switch",
              fields: { workspace: "w2" },
              icon: tile("F"),
            },
            { id: "add", label: "+ Add workspace", href: "#add-workspace" },
          ],
        },
      ],
    },
  ],
  sections: [
    {
      id: "guides",
      label: "Guides",
      groups: [
        {
          label: "Getting started",
          links: [
            { label: "Install", href: "#install" },
            { label: "First page", href: "#first-page" },
          ],
        },
        { label: "Field notes", links: [{ label: "This week", href: "#this-week" }] },
      ],
    },
    {
      id: "topics",
      label: "Topics",
      panelSize: "wide",
      panelClassName: "sh-ex-mega",
      panel: (
        <ul className="sh-ex-mega-tiles" aria-label="Topics">
          {TOPICS.map(([title, line]) => (
            <li key={title}>
              <a href={`#${title.toLowerCase().replace(" ", "-")}`}>
                <b>{title}</b>
                <span>{line}</span>
              </a>
            </li>
          ))}
        </ul>
      ),
    },
    { id: "pricing", label: "Pricing", href: "#pricing", current: true },
    { id: "about", label: "About", href: "#about" },
  ],
  extras: [{ id: "quote", label: "Get a quote", kind: "button", href: "#quote", phone: "bar" }],
  themePrefKey: "cap-theme-specimen-static",
  themeCookie: "sample_theme",
  themeKey: "T",
  account: {
    name: "Alex Rivera",
    initials: initials("Alex Rivera", "alex@example.com"),
    detail: "alex@example.com",
    groups: [
      {
        links: [
          { label: "Settings", href: "#settings" },
          { label: "Help", href: "#help" },
        ],
      },
    ],
    signOutAction: "#sign-out",
    signOutFields: { token: "sample-token" },
  },
  skipTo: "#main",
};
// A site with its own look on the same header, by tokens and slots only.
const ownHeader: SiteHeaderProps = {
  hydrate: false,
  theme: false,
  translucent: true,
  links: "center",
  collapse: "lg",
  sheetIcons: "auto",
  logo: { href: "#home", label: "Example Writers", name: "Example Writers home" },
  sections: [
    {
      id: "services",
      label: "Services",
      groups: [
        {
          links: [
            { label: "Editing", href: "#editing" },
            { label: "Writing", href: "#writing" },
          ],
        },
      ],
    },
    { id: "pricing", label: "Pricing", href: "#pricing", current: true },
    { id: "about", label: "About", href: "#about" },
  ],
  extras: [
    { id: "quote", label: "Get a quote", kind: "button", href: "#quote", className: "sh-own-cta" },
  ],
  skipTo: "#main",
};
for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-static]"))) {
  const own = el.hasAttribute("data-own");
  setStaticHtml(
    el,
    renderToStaticMarkup(
      <div className={own ? "sh-site sh-own" : "sh-site"} data-family="teal">
        <SiteHeader {...(own ? ownHeader : staticHeader)} />
        <Hero
          title="No React in the browser, the same header."
          lead="Rendered once to HTML; the behavior module wires the panels, the sheet, the theme and its key."
        />
      </div>,
      { identifierPrefix: "static" },
    ),
  );
  enhance(el);
  enhanceTheme(el);
  const press = el.dataset.static ? el.querySelector<HTMLElement>(el.dataset.static) : null;
  if (press)
    requestAnimationFrame(() =>
      press.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })),
    );
}
