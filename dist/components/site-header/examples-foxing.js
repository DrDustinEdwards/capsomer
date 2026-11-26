import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The specimen data for Foxing's site header: its public page, a signed-in reader, the bottom tabs and its admin
// (examples.tsx mounts them; examples-sites.tsx has the other sites').
import { FAMILY_APPS, FIRST_PAGE, } from "../admin-shell/admin-shell.react.js";
import { D, hd, icon, ownerBase } from "./examples-sites.js";
import {} from "./site-header.react.js";
// The fox site: a translucent band, centered section links, its own panels.
const FOX_MARK = FAMILY_APPS.find((a) => a.id === "foxing")?.logo;
const FX_LOGO = {
    href: "#home",
    label: "Foxing",
    mark: FOX_MARK,
    wordmark: (_jsx("span", { className: "sh-fx-wordmark", "aria-hidden": "true", children: "Foxing" })),
};
const booksPanel = (_jsxs("div", { className: "sh-mega", children: [_jsxs("div", { children: [_jsx("p", { className: "sh-mega-label", children: "Browse" }), _jsxs("ul", { children: [_jsx("li", { children: _jsx("a", { href: "#books", children: "All books" }) }), _jsx("li", { children: _jsx("a", { href: "#awards", children: "Award winners" }) })] })] }), _jsxs("div", { children: [_jsx("p", { className: "sh-mega-label", children: "By era" }), _jsx("ul", { className: "sh-chips", children: ["Before 1800", "1800 to 1899", "1900 to 1949", "1950 and later"].map((e) => (_jsx("li", { children: _jsx("a", { href: `#era-${e.slice(0, 4)}`, children: e }) }, e))) })] })] }));
const picksPanel = (_jsxs("div", { className: "sh-mega", "data-cols": "1", children: [_jsxs("a", { className: "sh-pick", href: "#pick", children: [_jsx("span", { className: "sh-mega-label", children: "Foxing pick" }), _jsx("b", { children: "The Lantern Keeper" }), _jsx("span", { children: "A. N. Sample" })] }), _jsx("p", { className: "sh-mega-label", children: "Featured clubs" }), _jsx("ul", { "data-cols": "2", children: ["Morning Readers", "The Long Shelf", "Second Chapter", "Night Owls"].map((c) => (_jsx("li", { children: _jsx("a", { href: `#club-${c.length}`, children: c }) }, c))) })] }));
const fxSections = [
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
export const fxPublic = {
    logo: FX_LOGO,
    translucent: true,
    links: "center",
    sections: fxSections,
    extras: [fxSearch, { id: "join", label: "Join free", kind: "button", href: "#join" }],
    signIn: { href: "#sign-in" },
    skipTo: "#main",
    themeKey: "t",
};
// Signed in: the bell joins Search, and the menu is the site's own panel.
const fxAccount = {
    name: "Sam Rivera",
    initials: "SR",
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Crect width='8' height='8' fill='%23f5c9a8'/%3E%3Ccircle cx='4' cy='3' r='1.6' fill='%23b64404'/%3E%3Cpath d='M1 8a3 3 0 0 1 6 0z' fill='%23b64404'/%3E%3C/svg%3E",
    groups: [
        {
            links: ["Reading stats", "Library", "Diary", "Profile", "Settings"].map((l) => ({
                label: l,
                href: `#${l.toLowerCase().replace(/ /g, "-")}`,
            })),
        },
    ],
    onSignOut: () => undefined,
    panel: (_jsxs("div", { className: "sh-fx-account", children: [_jsxs("div", { className: "sh-fx-id", children: [_jsx("b", { children: "Sam Rivera" }), _jsx("span", { children: "@samreads" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dd", { children: "14" }), _jsx("dt", { children: "books this year" })] }), _jsxs("div", { children: [_jsx("dd", { children: "6" }), _jsx("dt", { children: "day streak" })] }), _jsxs("div", { children: [_jsx("dd", { children: "212" }), _jsx("dt", { children: "highlights" })] })] }), _jsxs("ul", { children: [["Reading stats", "Library", "Diary", "Profile", "Settings"].map((l) => (_jsx("li", { children: _jsx("a", { href: `#${l.toLowerCase().replace(/ /g, "-")}`, children: l }) }, l))), _jsx("li", { children: _jsx("button", { type: "button", "data-panel-close": "", children: "Sign out" }) })] })] })),
};
export const fxReader = {
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
export const fxAdmin = {
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
