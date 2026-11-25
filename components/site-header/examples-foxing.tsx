// The specimen data for Foxing's site header: its public page, a signed-in reader, the bottom tabs and its admin
// (examples.tsx mounts them; examples-sites.tsx has the other sites').
import {
  FAMILY_APPS,
  FIRST_PAGE,
  type AdminShellProps,
} from "../admin-shell/admin-shell.react.tsx";
import { D, hd, icon, ownerBase } from "./examples-sites.tsx";
import {
  type HeaderAccount,
  type HeaderSection,
  type SiteHeaderProps,
} from "./site-header.react.tsx";

// The fox site: Foxing's look, its placeholder mark and its name in the serif, a translucent band
// in the page's ground, its section links centered. Books and Celebrity Picks open Foxing's own
// panels, laid out as Foxing draws them.
const FOX_MARK = FAMILY_APPS.find((a) => a.id === "foxing")?.logo;
const FX_LOGO = {
  href: "#home",
  label: "Foxing",
  mark: FOX_MARK,
  wordmark: (
    <span className="sh-fx-wordmark" aria-hidden="true">
      Foxing
    </span>
  ),
};
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
  {
    id: "books",
    label: "Books",
    current: true,
    panel: booksPanel,
    groups: [
      {
        links: [
          { label: "All books", href: "#books" },
          { label: "Award winners", href: "#awards" },
        ],
      },
    ],
  },
  {
    id: "picks",
    label: "Celebrity Picks",
    panel: picksPanel,
    groups: [
      {
        links: [
          { label: "This month's pick", href: "#pick" },
          { label: "All picks", href: "#picks" },
        ],
      },
    ],
  },
  { id: "clubs", label: "Clubs", href: "#clubs" },
  { id: "people", label: "People", href: "#people" },
  { id: "journal", label: "Journal", href: "#journal" },
];
const fxSearch = {
  id: "search",
  label: "Search",
  icon: hd(D.search),
  onClick: () => undefined,
  keys: "/",
};
export const fxPublic: SiteHeaderProps = {
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
  avatar:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Crect width='8' height='8' fill='%23f5c9a8'/%3E%3Ccircle cx='4' cy='3' r='1.6' fill='%23b64404'/%3E%3Cpath d='M1 8a3 3 0 0 1 6 0z' fill='%23b64404'/%3E%3C/svg%3E",
  groups: [
    {
      links: ["Reading stats", "Library", "Diary", "Profile", "Settings"].map((l) => ({
        label: l,
        href: `#${l.toLowerCase().replace(/ /g, "-")}`,
      })),
    },
  ],
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
export const fxReader: SiteHeaderProps = {
  ...fxPublic,
  sections: fxSections.map((s) => ({ ...s, current: false })),
  extras: [
    fxSearch,
    {
      id: "bell",
      label: "Notifications",
      icon: hd(D.bell),
      href: "#notifications",
      count: 3,
      countNote: "new",
    },
  ],
  signIn: undefined,
  account: fxAccount,
};
export const fxTabs = [
  { label: "Home", href: "#home", icon: hd(D.home), current: true },
  { label: "Library", href: "#library", icon: hd(D.book) },
  { label: "Diary", href: "#diary", icon: hd(D.pen) },
  { label: "Feed", href: "#feed", icon: hd(D.list) },
  { label: "People", href: "#people", icon: hd(D.people) },
];
export const fxAdmin: AdminShellProps = {
  ...ownerBase("foxing", [
    { id: "overview", label: FIRST_PAGE, href: "#overview", icon: icon(D.grid), current: true },
    { id: "books", label: "Books", href: "#books", icon: icon(D.book), group: "Catalog" },
    { id: "picks", label: "Picks", href: "#picks", icon: icon(D.star), group: "Catalog" },
    { id: "clubs", label: "Clubs", href: "#clubs", icon: icon(D.people), group: "Catalog" },
    {
      id: "journal",
      label: "Journal",
      href: "#journal",
      icon: icon(D.pen),
      count: 2,
      countNote: "drafts",
      group: "Content",
    },
    {
      id: "notifications",
      label: "Notifications",
      href: "#notifications",
      icon: icon(D.bell),
      group: "Content",
    },
    {
      id: "users",
      label: "Users",
      href: "#users",
      icon: icon(D.people),
      count: 1,
      countNote: "reported",
      tone: "need",
      group: "People",
    },
  ]),
  logo: FX_LOGO,
  translucent: true,
};
