// Mounts the admin shell specimens. Every element with data-mount="<state>" gets that state.
import { StrictMode, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { showTip } from "../tooltip/tooltip.ts";
import { AdminShell, FAMILY_APPS, FIRST_PAGE, FOXHOUND_MARKS, startPageTransition, type AdminEntry, type AdminShellProps } from "./admin-shell.react.tsx";

const svg = (d: string) => (
  <svg className="cap-admin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
const GRID = svg("M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z");
const GLOBE = svg("M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18");
const ALERT = svg("M12 3l9.5 17h-19zM12 10v4M12 17h.01");
const LIST = svg("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01");
const CLOCK = svg("M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 3");
const FOLDER = svg("M3 7h6l2 2h10v10H3z");

const nav: AdminEntry[] = [
  { id: "overview", label: FIRST_PAGE, href: "#overview", icon: GRID, current: true, group: "Watch" },
  { id: "sites", label: "Sites", href: "#sites", icon: GLOBE, count: 11, group: "Watch" },
  { id: "incidents", label: "Incidents", href: "#incidents", icon: ALERT, count: 4, countNote: "open", tone: "need", group: "Watch" },
  { id: "queue", label: "Queue", href: "#queue", icon: LIST, count: 5, countNote: "blocked", tone: "need", group: "Work" },
  { id: "activity", label: "Activity", href: "#activity", icon: CLOCK, count: 120, group: "Records" },
  { id: "namespaces", label: "Namespaces", href: "#namespaces", icon: FOLDER, count: 11, group: "Records" },
];

const base: Omit<AdminShellProps, "children"> = {
  app: "portal",
  badges: { portal: { count: 3 }, carrel: { count: 2, countNote: "AI drafts waiting" }, germomics: { count: 1, countNote: "check failing" } },
  nav,
  page: FIRST_PAGE,
  onSearch: () => undefined,
  inbox: { count: 7, countNote: "need you", href: "#inbox" },
  onHelp: () => undefined,
  viewSite: "#site",
  account: {
    role: "Owner",
    email: "dustin@example.test",
    appLinks: [{ label: "Portal settings", href: "#settings" }, { label: "Keyboard shortcuts", onClick: () => undefined }],
    onSignOut: () => undefined,
  },
  // Six minutes before the page was opened, so the specimen always reads "6 minutes ago".
  updated: { at: Date.now() - 6 * 60_000, auto: true },
  onRefresh: () => undefined,
  refreshShortcut: "R",
};

const Page = ({ children }: { children?: ReactNode }) => (
  <div className="cap-admin-page">
    <h1>{FIRST_PAGE}</h1>
    <p className="cap-muted">The page's own content sits here, and the document scrolls. {children}</p>
  </div>
);

const key = (name: string) => `cap-admin-specimen-${name}`;
const remember = (name: string, value: string) => {
  try {
    localStorage.setItem(key(name), value);
  } catch {
    // A blocked store: the specimen shows its default.
  }
};

function Shell({ name, collapsed, ...rest }: { name: string; collapsed?: boolean } & Partial<AdminShellProps>) {
  if (collapsed) remember(name, "collapsed");
  return (
    <AdminShell {...base} prefKey={key(name)} {...rest}>
      <Page />
    </AdminShell>
  );
}

// Shows the name a hovered control would show, for the picture; the spec checks real hover and focus.
const showName = (sel: string, i: number) => {
  const frame = requestAnimationFrame(() => {
    const el = document.querySelectorAll<HTMLElement>(sel)[i];
    if (el) showTip(el);
  });
  return () => cancelAnimationFrame(frame);
};
function Tipped() {
  useEffect(() => showName(".cap-admin-tile", 1), []);
  return <Shell name="tip" />;
}

// Collapsed, with a menu icon's name shown, for the picture.
function CollapsedTip() {
  useEffect(() => showName(".cap-admin-menu a", 1), []);
  return <Shell name="collapsed-tip" collapsed />;
}

// Opens the header's account menu, for the picture: a press with no pointer, as a key gives.
function AccountOpen() {
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".cap-site-header-avatar")?.click());
    return () => cancelAnimationFrame(frame);
  }, []);
  return <Shell name="account" />;
}

function SheetOpen() {
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".cap-site-header-menu")?.click());
    return () => cancelAnimationFrame(frame);
  }, []);
  return <Shell name="phone-sheet" />;
}

// A reader's own area on a site outside the family: the user variant (no strip, the 288px menu),
// the site's sections in the menu, a centered reading column.
const reader: Partial<AdminShellProps> = {
  variant: "user",
  app: undefined,
  title: "dustinedwards.info",
  logo: { href: "#home", label: "dustinedwards.info", mark: FAMILY_APPS.find((a) => a.id === "info")?.logo },
  nav: [
    { id: "research", label: "Research", href: "#research", icon: FOLDER, current: true },
    { id: "protocols", label: "Protocols", href: "#protocols", icon: LIST },
    { id: "episodes", label: "Episodes", href: "#episodes", icon: CLOCK },
  ],
  inbox: undefined,
  account: undefined,
  updated: undefined,
  onRefresh: undefined,
  page: "Research",
};

// A customer's own dashboard (the user variant): no strip, the 288px menu, so its page starts at
// the same x as your admin's; the business and product switchers sit in the header.
const dashboard: Partial<AdminShellProps> = {
  variant: "user",
  app: undefined,
  title: "Acme Supply Co.",
  logo: { href: "#home", label: "Acme Supply Co.", mark: GRID },
  badges: undefined,
  onSearch: undefined,
  inbox: undefined,
  onHelp: () => undefined,
  viewSite: undefined,
  switchers: [
    { id: "business", label: "Acme Supply Co.", name: "Business: Acme Supply Co.", tile: "A", sheetLabel: "Businesses", groups: [{ links: [{ label: "Acme Supply Co.", href: "#acme", current: true }, { label: "Northwind Goods", href: "#northwind" }] }] },
    { id: "product", label: "Recovery", name: "Product: Recovery", sheetLabel: "Products", groups: [{ links: [{ label: "Console", href: "#console" }, { label: "Recovery", href: "#recovery", current: true }, { label: "Disputes", href: "#disputes" }] }] },
  ],
  account: { name: "Sam Rivera", initials: "SR", email: "sam@example.com", appLinks: [{ label: "Settings", href: "#settings" }, { label: "Billing", href: "#billing" }], onSignOut: () => undefined },
};

// Page transitions: the menu links and the button change the page inside startPageTransition, so
// the content cross-fades and the strip and menu stay put.
const PAGES = ["overview", "sites", "queue"];
function Transitioning() {
  const [page, setPage] = useState(0);
  const go = (to: number) => void startPageTransition(() => flushSync(() => setPage(to)));
  const entries = nav.map((e) => ({ ...e, current: e.id === PAGES[page] }));
  return (
    <AdminShell
      {...base}
      nav={entries}
      page={entries.find((e) => e.current)?.label}
      transition
      prefKey={key("transition")}
      renderLink={({ children, ...rest }) => (
        <a
          {...rest}
          onClick={(e) => {
            const to = PAGES.indexOf(rest.href.slice(1));
            if (to < 0) return;
            e.preventDefault();
            go(to);
          }}
        >
          {children}
        </a>
      )}
    >
      <div className="cap-admin-page" key={page}>
        <h1 data-testid="page-title">{PAGES[page]}</h1>
        <p className="cap-muted">Page {page + 1} of {PAGES.length}.</p>
        <button type="button" className="cap-btn" onClick={() => go((page + 1) % PAGES.length)}>
          Next page
        </button>
      </div>
    </AdminShell>
  );
}

// An app whose routes set their own tab titles: the shell leaves document.title alone, even as
// the page changes. A layout effect runs before the shell's own effect would, so the shell, were
// it still writing, would win.
function OwnTitle() {
  const [page, setPage] = useState(0);
  useLayoutEffect(() => {
    document.title = `${PAGES[page]} - the app's own title`;
  }, [page]);
  const entries = nav.map((e) => ({ ...e, current: e.id === PAGES[page] }));
  return (
    <AdminShell {...base} nav={entries} page={entries.find((e) => e.current)?.label} documentTitle={false} prefKey={key("own-title")}>
      <div className="cap-admin-page">
        <h1 data-testid="page-title">{PAGES[page]}</h1>
        <button type="button" className="cap-btn" onClick={() => setPage((page + 1) % PAGES.length)}>
          Next page
        </button>
      </div>
    </AdminShell>
  );
}

// Foxhound's mark: today's x beside the two alternatives, for Dustin to pick from.
function FoxhoundMarks() {
  const today = FAMILY_APPS.find((a) => a.id === "foxhound")?.logo;
  const options: [string, string, ReactNode][] = [["today", "Today: the favicon's x", today], ...Object.entries(FOXHOUND_MARKS).map(([k, v]): [string, string, ReactNode] => [k, k === "track" ? "Alternative: a paw print" : "Alternative: a fox's head", v])];
  return (
    <ul className="cap-admin-marks" style={{ display: "flex", gap: "2rem", listStyle: "none", margin: 0, padding: "1rem" }}>
      {options.map(([id, label, logo]) => (
        <li key={id} data-mark={id} style={{ display: "grid", justifyItems: "center", gap: ".5rem", color: "var(--text)" }}>
          <span style={{ display: "grid", placeItems: "center", width: 56, height: 56, borderRadius: 12, background: "var(--ground)", border: "1px solid var(--line)", color: "var(--text)" }}><span style={{ display: "grid", width: 28, height: 28 }}>{logo}</span></span>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

const SPECIMENS: Record<string, () => ReactNode> = {
  expanded: () => <Shell name="expanded" />,
  collapsed: () => <Shell name="collapsed" collapsed />,
  tip: () => <Tipped />,
  "collapsed-tip": () => <CollapsedTip />,
  trail: () => <Shell name="trail" nav={nav.map((e) => ({ ...e, current: e.id === "sites" }))} page="fieldnotes.example" trail={[{ label: "Sites", href: "#sites" }]} />,
  account: () => <AccountOpen />,
  reader: () => (
    <AdminShell {...base} {...reader} prefKey={key("reader")} children={<div className="cap-admin-page" data-measure="reading"><h1>Research</h1><p>A reading column holds a comfortable line length.</p></div>} />
  ),
  user: () => <Shell name="user" {...dashboard} />,
  "user-collapsed": () => <Shell name="user-collapsed" collapsed {...dashboard} />,
  comfortable: () => (
    <div data-density="comfortable">
      <Shell name="comfortable" />
    </div>
  ),
  transition: () => <Transitioning />,
  "own-title": () => <OwnTitle />,
  // An app that passes only `app`: the strip still lists all seven, each with its real mark.
  minimal: () => (
    <AdminShell app="foxhound" nav={nav} page={FIRST_PAGE} prefKey={key("minimal")}>
      <Page />
    </AdminShell>
  ),
  "foxhound-marks": () => <FoxhoundMarks />,
  phone: () => <Shell name="phone" />,
  "phone-sheet": () => <SheetOpen />,
  "phone-counts": () => <Shell name="phone-counts" nav={nav.map((e) => (e.id === "queue" ? { ...e, count: 120 } : e))} />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
