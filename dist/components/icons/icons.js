// The network's icons, one place. Every drawing is one path on a 24-unit grid: the UI icons are
// stroked (currentColor, 1.6, round), in the form the admin menus already drew (txasm, Carrel, the
// Portal); the social marks are filled. Gathered from the sites' own inline SVGs (txasm's admin menu,
// Foxing's account panel and header, julieedwards.info's header, the germomics and bsw footers), so
// a site that moves onto them looks the same. A site's own mark (its logo) stays the site's.
export const ICONS = {
    add: "M12 5v14M5 12h14",
    "arrow-left": "M19 12H5M11 6l-6 6 6 6",
    "arrow-right": "M5 12h14M13 6l6 6-6 6",
    assign: "M8 4.5h8v3H8zM6 6H4.5v14.5h15V6H18M8.5 12.5h7M8.5 16h4",
    award: "M12 3.5a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM8.8 12.4 7.5 20.5l4.5-2.5 4.5 2.5-1.3-8.1",
    bell: "M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0",
    book: "M4.5 5c2.6-1 5.2-.8 7.5.8 2.3-1.6 4.9-1.8 7.5-.8v13.5c-2.6-1-5.2-.8-7.5.8-2.3-1.6-4.9-1.8-7.5-.8zM12 5.8v13.5",
    calendar: "M4.5 5.5h15v14h-15zM4.5 10h15M8.5 3.5v4M15.5 3.5v4",
    check: "M5 12.5l4.5 4.5L19 7.5",
    "chevron-down": "m6 9 6 6 6-6",
    "chevron-left": "m15 6-6 6 6 6",
    "chevron-right": "m9 6 6 6-6 6",
    "chevron-up": "m6 15 6-6 6 6",
    clock: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM12 7.5V12l3 2",
    close: "M6 6l12 12M18 6 6 18",
    copy: "M9 9h11v11H9zM5 15H4V4h11v1",
    decide: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM8 12.2l2.8 2.8L16.2 9.5",
    document: "M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 15.5h6",
    download: "M12 4v11M7 10l5 5 5-5M5 20h14",
    external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
    folder: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
    goals: "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 8.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4z",
    heart: "M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z",
    home: "M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z",
    mail: "M3.5 5.5h17v13h-17zM3.5 6l8.5 7 8.5-7",
    menu: "M4 7h16M4 12h16M4 17h16",
    moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
    overview: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    people: "M9 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM2.5 19.5c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.5c1.8.8 3 2.5 3.5 5",
    queue: "M3.5 13.5 6 5.5h12l2.5 8v5h-17zM3.5 13.5h5l1 2h5l1-2h5",
    roles: "M10 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM3.5 19.5c.8-3.5 3.3-5.5 6.5-5.5 1.5 0 2.8.4 3.9 1.2M15 18l2 2 4-4",
    rss: "M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8M5.5 18.5h.01",
    search: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.2-3.2",
    settings: "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8",
    star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z",
    stats: "M5 20V11M12 20V5M19 20v-6",
    sun: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
    tag: "M3.5 3.5h8l9 9-8 8-9-9zM8 7.5h.01",
    ticket: "M3.5 7.5h17v3a1.5 1.5 0 0 0 0 3v3h-17v-3a1.5 1.5 0 0 0 0-3zM14.5 7.5v9",
};
export const SOCIAL = {
    facebook: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6 4.39 10.97 10.13 11.85v-8.38H7.08v-3.47h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.96h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.47h-2.8v8.38C19.61 23.04 24 18.07 24 12.07z",
    instagram: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.36-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z",
    linkedin: "M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0zM3.5 8.5h3.3V21H3.5zm5.6 0h3.16v1.7h.05c.44-.83 1.5-1.7 3.1-1.7 3.32 0 3.93 2.18 3.93 5v6.5h-3.3v-5.76c0-1.37-.02-3.14-1.9-3.14-1.92 0-2.2 1.5-2.2 3.04V21H9.1z",
    x: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zM17.61 20.64h2.04L6.49 3.24H4.3z",
};
const NS = "http://www.w3.org/2000/svg";
// An icon as an <svg> element, built with the DOM (no markup string, so no Trusted Types sink). It
// is hidden from assistive technology unless it is given a label, which names it as an image.
export function iconSvg(name, label) {
    const svg = document.createElementNS(NS, "svg");
    const social = name in SOCIAL;
    svg.setAttribute("class", "cap-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    if (social)
        svg.setAttribute("data-fill", "");
    if (label) {
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", label);
    }
    else
        svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", social ? SOCIAL[name] : ICONS[name]);
    svg.append(path);
    return svg;
}
