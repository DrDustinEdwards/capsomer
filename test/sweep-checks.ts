// The checks the sweep runs in the page, installed as window.__sweep.
export function install(): void {
  const vis = (el: Element) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    if (
      cs.visibility === "hidden" ||
      cs.display === "contents" ||
      el.closest("[hidden], [inert], template, svg *, details:not([open]) > :not(summary)")
    )
      return false;
    // Visually hidden (.cap-sr-only, Enarratio's hidden list and caption): clipped to nothing.
    for (let a: Element | null = el; a; a = a.parentElement)
      if (getComputedStyle(a).clipPath === "inset(50%)") return false;
    return true;
  };
  const label = (el: Element) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = [...el.classList]
      .filter((c) => !c.startsWith("cm-"))
      .slice(0, 2)
      .map((c) => `.${c}`)
      .join("");
    const text = (el.getAttribute("aria-label") ?? el.textContent ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 30);
    const at = el.closest("[id]:not(html):not(body)");
    const place = at && at !== el ? ` in #${at.id}` : "";
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` "${text}"` : ""}${place}`;
  };
  const all = () =>
    [...document.body.querySelectorAll("*")].filter(
      (el) => !(el instanceof HTMLIFrameElement && el.classList.contains("cap-specimen-frame")),
    );
  const clipsX = (el: Element) => getComputedStyle(el).overflowX !== "visible";
  const named = (el: Element | null) =>
    !!el && (el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby"));

  // Sideways scroll of the page, and what causes it: an element past the window's edge with no
  // clipping or scrolling ancestor. A region that scrolls sideways must be named.
  const reflow = () => {
    const out: string[] = [];
    const past = new Set<Element>();
    const vw = document.documentElement.clientWidth;
    const scrolls = document.documentElement.scrollWidth > vw + 1;
    for (const el of all()) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (
        (r.right > vw + 1 || r.left < -1) &&
        (scrolls || (r.right > 0 && r.left < vw)) &&
        cs.position !== "fixed"
      ) {
        let held = false;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement)
          if (clipsX(a)) held = true;
        // The outermost cause only: a child of an element already reported adds nothing.
        if (!held && ![...past].some((p) => p.contains(el)))
          out.push(
            `${label(el)} runs past the window (${Math.round(r.left)} to ${Math.round(r.right)}px of ${vw})`,
          );
        if (!held) past.add(el);
      }
      if (
        (cs.overflowX === "auto" || cs.overflowX === "scroll") &&
        el.scrollWidth > el.clientWidth + 1 &&
        !named(el) &&
        !named(el.parentElement)
      ) {
        out.push(`${label(el)} scrolls sideways and is not a named region`);
      }
    }
    return out.slice(0, 12);
  };

  // Each element's horizontal spill past its parent (past the window, for a fixed element or one
  // in the top layer: an open popover or modal), to compare left to right with right to left.
  const spill = () => {
    const m = new Map<Element, number>();
    const vw = document.documentElement.clientWidth;
    for (const el of all()) {
      const p = el.parentElement;
      if (!p || !vis(el) || !vis(p) || el instanceof SVGElement) continue;
      const a = el.getBoundingClientRect();
      const top =
        getComputedStyle(el).position === "fixed" || el.matches(":popover-open, dialog:modal");
      const b = top ? new DOMRect(0, 0, vw, 0) : p.getBoundingClientRect();
      m.set(el, Math.max(0, b.left - a.left, a.right - b.right));
    }
    return m;
  };
  let ltr = new Map<Element, number>();
  const rtl = (phase: "ltr" | "rtl") => {
    if (phase === "ltr") {
      document.documentElement.dir = "";
      ltr = spill();
      return [];
    }
    document.documentElement.dir = "rtl";
    const now = spill();
    document.documentElement.dir = "";
    const out: string[] = [];
    for (const [el, px] of now)
      if (px > (ltr.get(el) ?? 0) + 2)
        out.push(`${label(el)} sticks out of its parent by ${Math.round(px)}px only right to left`);
    return out
      .filter(
        (m, i) => !out.slice(0, i).some((p) => p.split(" sticks ")[0] === m.split(" sticks ")[0]),
      )
      .slice(0, 12);
  };

  // Elements that clip (overflow hidden or clip) and hold text, and whether their content is
  // already bigger than their box.
  const clipped = () => {
    const s = new Set<Element>();
    for (const el of all()) {
      if (!vis(el) || !(el.textContent ?? "").trim()) continue;
      const cs = getComputedStyle(el);
      const cut = (v: string) => v === "hidden" || v === "clip";
      if (
        (cut(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) ||
        (cut(cs.overflowY) && el.scrollHeight > el.clientHeight + 1)
      )
        s.add(el);
    }
    return s;
  };
  let before = new Set<Element>();
  const spacing = (phase: "before" | "after") => {
    if (phase === "before") {
      before = clipped();
      const style = document.createElement("style");
      style.id = "sweep-text-spacing";
      style.textContent =
        "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-block-end: 2em !important; }";
      document.head.append(style);
      return [];
    }
    const out = [...clipped()]
      .filter((el) => !before.has(el))
      .map((el) => `${label(el)} clips its text`);
    document.getElementById("sweep-text-spacing")?.remove();
    return out.slice(0, 12);
  };

  // A target's hit extent along the lines through its center, by hit testing, so a label, a
  // ::before hit area and padding count, and what covers it does not.
  const TARGETS =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [role=menuitemradio], [role=menuitemcheckbox], [role=option], [role=treeitem], [role=slider], [role=combobox], [tabindex]:not([tabindex='-1'])";
  const owns = (el: Element, h: Element | null) =>
    !!h &&
    (el.contains(h) ||
      (el instanceof HTMLInputElement && [...(el.labels ?? [])].some((l) => l.contains(h))));
  const targets = () => {
    const found: {
      el: Element;
      label: string;
      w: number;
      h: number;
      x: number;
      y: number;
      box: DOMRect;
    }[] = [];
    for (const el of document.body.querySelectorAll(TARGETS)) {
      if (
        !vis(el) ||
        (el as HTMLButtonElement).disabled ||
        el.closest("[aria-disabled='true'], [aria-hidden='true']")
      )
        continue;
      // Inline in a sentence: WCAG 2.5.8's inline exception. The sentence is the block the link
      // runs in, past any inline wrapper (a footnote's sup, a byline name's strong or span).
      let line = el.parentElement;
      while (line?.parentElement && getComputedStyle(line).display === "inline")
        line = line.parentElement;
      if (
        getComputedStyle(el).display === "inline" &&
        line &&
        (line.textContent ?? "").trim().length > (el.textContent ?? "").trim().length + 1
      )
        continue;
      el.scrollIntoView({ block: "center", inline: "center" });
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (!owns(el, document.elementFromPoint(cx, cy))) continue; // covered, or hit-tests to its label only
      let l = cx;
      let rr = cx;
      let t = cy;
      let b = cy;
      while (l > r.left - 30 && owns(el, document.elementFromPoint(l - 1, cy))) l--;
      while (rr < r.right + 30 && owns(el, document.elementFromPoint(rr + 1, cy))) rr++;
      while (t > r.top - 30 && owns(el, document.elementFromPoint(cx, t - 1))) t--;
      while (b < r.bottom + 30 && owns(el, document.elementFromPoint(cx, b + 1))) b++;
      // Hit testing reads whole pixels; where the hits reach both edges of the box, the box's own
      // (fractional) size is the size.
      const w = Math.max(rr - l + 1, l <= r.left + 1 && rr >= r.right - 2 ? r.width : 0);
      const h = Math.max(b - t + 1, t <= r.top + 1 && b >= r.bottom - 2 ? r.height : 0);
      const sx = window.scrollX;
      const sy = window.scrollY;
      found.push({
        el,
        label: label(el),
        w: Math.round(w * 100) / 100,
        h: Math.round(h * 100) / 100,
        x: cx + sx,
        y: cy + sy,
        box: new DOMRect(r.left + sx, r.top + sy, r.width, r.height),
      });
    }
    const out: string[] = [];
    for (const f of found) {
      if (f.w >= 44 && f.h >= 44) continue;
      const near = found.find((o) => {
        if (o === f || o.el.contains(f.el) || f.el.contains(o.el)) return false;
        const dx = Math.max(o.box.left - f.x, 0, f.x - o.box.right);
        const dy = Math.max(o.box.top - f.y, 0, f.y - o.box.bottom);
        return Math.hypot(dx, dy) < 22;
      });
      if (f.w < 24 || f.h < 24) out.push(`${f.label} is ${f.w} x ${f.h}px`);
      else if (near) out.push(`${f.label} is ${f.w} x ${f.h}px with ${near.label} within 22px`);
    }
    window.scrollTo(0, 0);
    return out.slice(0, 15);
  };

  // A link is told by weight, not a line (DEFAULTS.md): no link is underlined (the current page
  // in a bar may be, as its marker), and a text link, inline with no component class, is semibold.
  const links = () => {
    const out: string[] = [];
    for (const el of document.body.querySelectorAll("a[href]")) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.textDecorationLine.includes("underline") && !el.hasAttribute("aria-current"))
        out.push(`${label(el)} is underlined`);
      else if (
        cs.display === "inline" &&
        !el.matches("[class*='cap-']") &&
        Number(cs.fontWeight) < 600
      )
        out.push(`${label(el)} is a text link at weight ${cs.fontWeight}, not 600`);
    }
    return out.slice(0, 12);
  };

  // The link system (components/link/link.md). A state is shown with its data-force hook, since
  // :visited cannot be read by script; transitions are held so a state reads at once.
  const KIND_MARK: Record<string, [pseudo: "::before" | "::after", glyph: string]> = {
    away: ["::after", "\u2197"],
    file: ["::after", "\u2193"],
    jump: ["::after", "#"],
    email: ["::before", "\u2709"],
    phone: ["::before", "\u260E"],
  };
  const GLYPHS = /[\u2197\u2193#\u2709\u260E\u21A9]/;
  const paint = (el: Element) => {
    for (let a: Element | null = el; a; a = a.parentElement) {
      const bg = getComputedStyle(a).backgroundColor;
      if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  const textLink = (el: Element) =>
    // A link that is only a picture has no text to underline: its cue is the picture and the cursor.
    el.matches(
      ':is(:not([class*="cap-"]), [data-link], .cap-footnote-ref):not(nav a, :has(> img:only-child))',
    );
  const drawn = (el: Element, pseudo: "::before" | "::after") => {
    const cs = getComputedStyle(el, pseudo);
    if (cs.content === "none" || cs.content === "normal" || cs.display === "none") return false;
    return (
      cs.content !== '""' ||
      ((cs.maskImage !== "none" || cs.clipPath !== "none") && parseFloat(cs.width) > 0)
    );
  };
  const kinds = (forced: boolean) => {
    const out: string[] = [];
    const hold = document.createElement("style");
    hold.textContent = "*, *::before, *::after { transition: none !important; }";
    document.head.append(hold);
    for (const el of document.body.querySelectorAll("a[href]")) {
      if (!vis(el)) continue;
      // No mark glyph is read: CSS content keeps it only with alt text after a slash.
      for (const pseudo of ["::before", "::after"] as const) {
        const c = getComputedStyle(el, pseudo).content;
        if (GLYPHS.test(c.split(" / ")[0] ?? "") && !c.includes(" / "))
          out.push(`${label(el)} has a mark ${pseudo} a screen reader reads (${c})`);
      }
      const kind = el.getAttribute("data-link");
      const mark = kind ? KIND_MARK[kind] : undefined;
      if (
        mark &&
        !(kind === "away" && el.querySelector(".cap-link-icon")) &&
        !getComputedStyle(el, mark[0]).content.includes(mark[1])
      )
        out.push(`${label(el)} (${kind}) shows no ${mark[1]}`);
      if (kind === "family" && !drawn(el, "::before"))
        out.push(`${label(el)} (family) shows no icon`);
      if (kind === "next" && !drawn(el, "::after")) out.push(`${label(el)} (next) shows no arrow`);
      if (kind === "tag" && getComputedStyle(el).borderTopStyle !== "solid")
        out.push(`${label(el)} (tag) is not a pill`);
      if (
        forced &&
        kind === "family" &&
        getComputedStyle(el, "::before").backgroundColor === paint(el)
      )
        out.push(`${label(el)} (family) loses its icon in forced colors`);
      if (forced || !textLink(el) || el.hasAttribute("data-force")) continue;
      // The base cues, where no component has recolored the link.
      const probe = document.createElement("span");
      probe.style.color = "var(--accent-text)";
      el.parentElement?.append(probe);
      const own = getComputedStyle(probe).color;
      probe.remove();
      const rest = { color: getComputedStyle(el).color, bg: paint(el) };
      if (rest.color !== own) continue;
      const state = (force: string) => {
        el.setAttribute("data-force", force);
        const s = { color: getComputedStyle(el).color, bg: paint(el) };
        el.removeAttribute("data-force");
        return s;
      };
      const hover = state("hover");
      const pressed = state("pressed");
      const visited = state("visited");
      if (hover.bg === rest.bg) out.push(`${label(el)} has no tint under the pointer`);
      if (pressed.bg === hover.bg || pressed.bg === rest.bg)
        out.push(`${label(el)} pressed looks like hover or rest`);
      if (visited.color === rest.color) out.push(`${label(el)} visited looks like unvisited`);
      for (const [name, s] of Object.entries({ rest, hover, pressed, visited })) {
        const r = window.capRatio(s.color, s.bg);
        if (r < 4.5) out.push(`${label(el)} ${name} is ${r.toFixed(2)}:1`);
      }
    }
    hold.remove();
    return out.slice(0, 15);
  };

  // Every focusable element, focused from script with no pointer used (so :focus-visible
  // matches), must draw an outline on itself, on a pseudo-element or on an ancestor up to four
  // levels up (a row that rings when its link is focused) that had none before, or that shows
  // the focused look on purpose (data-force="focus", a specimen of it).
  const FOCUSABLE =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex='-1']), [contenteditable='true']";
  const rings = async () => {
    const out: string[] = [];
    const drawn = (el: Element, pseudo?: string) => {
      const cs = getComputedStyle(el, pseudo);
      return cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 1;
    };
    for (const el of document.body.querySelectorAll<HTMLElement>(FOCUSABLE)) {
      if (!vis(el) || (el as HTMLButtonElement).disabled || el.closest("[aria-hidden='true']"))
        continue;
      // A specimen may open with its input focused; its ring is then already drawn, and a ring set
      // by script (CodeMirror's .cm-focused) goes a frame or two after the blur.
      // Closing a popup on blur can hand focus back to its opener, so blur until focus stays out.
      for (
        let i = 0;
        i < 6 && document.activeElement && document.activeElement !== document.body;
        i++
      ) {
        (document.activeElement as HTMLElement).blur();
        for (let j = 0; j < 3; j++)
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      const near: HTMLElement[] = [];
      for (let a = el.parentElement; a && near.length < 4; a = a.parentElement) near.push(a);
      const was = near.map((a) => drawn(a));
      el.focus({ preventScroll: true });
      if (document.activeElement !== el) continue;
      const ok = () =>
        !el.matches(":focus-visible") ||
        drawn(el) ||
        drawn(el, "::before") ||
        drawn(el, "::after") ||
        near.some((a, i) => (!was[i] || a.dataset.force === "focus") && drawn(a));
      // A ring set by script on focus lands a frame or two later.
      for (let i = 0; i < 6 && !ok(); i++)
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (!ok()) out.push(`${label(el)} shows no outline on focus`);
      el.blur();
    }
    return out.slice(0, 15);
  };

  // The React side and the contract side of the parity check: each own class with its tag,
  // role and whether it is named.
  // The role an element has, written or implied by its tag (a <summary> is a button).
  const IMPLIED: Record<string, string> = {
    a: "link",
    button: "button",
    summary: "button",
    nav: "navigation",
    ul: "list",
    ol: "list",
    li: "listitem",
    dialog: "dialog",
    table: "table",
    select: "combobox",
    textarea: "textbox",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    h4: "heading",
    h5: "heading",
    h6: "heading",
    form: "form",
    main: "main",
    header: "banner",
    footer: "contentinfo",
  };
  const roleOf = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    if (el.getAttribute("role")) return el.getAttribute("role") as string;
    if (tag === "input")
      return (
        (
          {
            checkbox: "checkbox",
            radio: "radio",
            range: "slider",
            search: "searchbox",
            button: "button",
            submit: "button",
          } as Record<string, string>
        )[(el as HTMLInputElement).type] ?? "textbox"
      );
    if (tag === "a" && !el.hasAttribute("href")) return "generic";
    return IMPLIED[tag] ?? "generic";
  };
  const shape = (root: ParentNode, own: string[], skip: string) => {
    const out: { cls: string; tag: string; role: string; named: boolean }[] = [];
    for (const el of root.querySelectorAll("[class]")) {
      if (skip && el.closest(skip)) continue;
      for (const cls of el.classList)
        if (own.includes(cls))
          out.push({ cls, tag: el.tagName.toLowerCase(), role: roleOf(el), named: named(el) });
    }
    return out;
  };
  const reactShape = (own: string[], roots: string) =>
    [...document.querySelectorAll(roots)].flatMap((m) => shape(m, own, ""));
  const contractShape = (html: string[], own: string[], roots: string) =>
    html.flatMap((h) => shape(new DOMParser().parseFromString(h, "text/html").body, own, roots));

  Object.assign(window, {
    __sweep: { reflow, rtl, spacing, links, kinds, targets, rings, reactShape, contractShape },
  });
}

type Sweep = {
  reflow(): string[];
  rtl(phase: "ltr" | "rtl"): string[];
  spacing(phase: "before" | "after"): string[];
  links(): string[];
  kinds(forced: boolean): string[];
  targets(): string[];
  rings(): Promise<string[]>;
  reactShape(own: string[], roots: string): Shape[];
  contractShape(html: string[], own: string[], roots: string): Shape[];
};
export type Shape = { cls: string; tag: string; role: string; named: boolean };
declare global {
  interface Window {
    __sweep: Sweep;
  }
}
