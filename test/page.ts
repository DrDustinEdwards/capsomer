// The page helpers: each runs one function inside the page through `evaluate`, so they need no
// test runner and take a Playwright or a Puppeteer page alike (capsomer/testing/page). A site whose
// browser checks run on Puppeteer imports these; capsomer/testing re-exports them beside the
// Playwright helpers.

/** A browser page that runs a function inside it: Playwright's Page or Puppeteer's. */
export interface PageLike {
  evaluate(...args: never[]): Promise<unknown>;
}

interface Evaluator {
  evaluate<R, A>(fn: (arg: A) => R | Promise<R>, arg?: A): Promise<R>;
}

const run = (page: PageLike) => page as unknown as Evaluator;

// Resolves once every finite animation and transition on the page has ended: what is measured
// then is what stays on screen. Scroll-driven animations (the scroll fades) never finish, so only
// the document timeline counts.
export function settled(page: PageLike): Promise<void> {
  return run(page).evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (a) =>
            a.timeline === document.timeline &&
            Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity),
        )
        .map((a) => a.finished.catch(() => undefined)),
    ).then(() => undefined),
  );
}

export interface Reading {
  fg: string;
  bg: string;
  ratio: number;
}

// Contrast as the browser paints it: the color of the element (its text, or its border)
// against the first opaque background behind it, compositing translucent layers. From the
// Capsid Portal's contrast spec, where it caught a selected row at 1.06:1. A selector ending in
// ::before or ::after reads that pseudo-element (a sliding highlight's edge), on its element.
export function paintedContrast(
  page: PageLike,
  selector: string,
  part: "color" | "border" | "outline" = "color",
): Promise<Reading | null> {
  return run(page).evaluate(
    ([full, which]) => {
      const [sel = full, pseudo] = full.split(/(?=::)/);
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return null;
      const parse = (s: string): [number, number, number, number] => {
        // A color-mix() computes to color(srgb r g b / a), its channels from 0 to 1.
        const srgb = s.match(/color\(srgb ([^)]+)\)/)?.[1];
        if (srgb) {
          const q = srgb
            .split(/[\s/]+/)
            .filter(Boolean)
            .map(Number);
          return [
            Math.round((q[0] ?? 0) * 255),
            Math.round((q[1] ?? 0) * 255),
            Math.round((q[2] ?? 0) * 255),
            q.length > 3 ? (q[3] ?? 1) : 1,
          ];
        }
        const m = s.match(/rgba?\(([^)]+)\)/);
        const inner = m?.[1];
        if (!inner) return [0, 0, 0, 0];
        const p = inner
          .split(/[\s,/]+/)
          .filter(Boolean)
          .map(Number);
        return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0, p.length > 3 ? (p[3] ?? 1) : 1];
      };
      const over = (
        top: [number, number, number, number],
        under: [number, number, number],
      ): [number, number, number] => {
        const a = top[3];
        return [
          Math.round(top[0] * a + under[0] * (1 - a)),
          Math.round(top[1] * a + under[1] * (1 - a)),
          Math.round(top[2] * a + under[2] * (1 - a)),
        ];
      };
      let bg: [number, number, number] = [255, 255, 255];
      const layers: [number, number, number, number][] = [];
      for (
        let n: HTMLElement | null = which === "color" || pseudo ? el : el.parentElement;
        n;
        n = n.parentElement
      ) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c[3] > 0) layers.unshift(c);
        if (c[3] >= 1) break;
      }
      if (layers.length === 0 || (layers[0]?.[3] ?? 0) < 1)
        layers.unshift(parse(getComputedStyle(document.body).backgroundColor));
      // SVG text is painted with fill, on the shape drawn before it in its group (a tile's
      // polygon, a box's rect), not on a CSS background.
      const svgText = which === "color" && (el as Element) instanceof SVGTextElement;
      if (svgText) {
        const shape = el.parentElement?.querySelector("polygon, rect, circle");
        const fill = shape ? parse(getComputedStyle(shape).fill) : [0, 0, 0, 0];
        if ((fill[3] ?? 0) > 0) layers.push(fill as [number, number, number, number]);
      }
      for (const l of layers) bg = over(l, bg);
      const cs = getComputedStyle(el, pseudo ?? null);
      const fgRaw = parse(
        svgText
          ? cs.fill
          : which === "color"
            ? cs.color
            : which === "border"
              ? cs.borderTopColor
              : cs.outlineColor,
      );
      const fg = over(fgRaw, bg);
      const lum = (c: [number, number, number]) => {
        const f = (v: number) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
      };
      const a = lum(fg);
      const b = lum(bg);
      const hex = (c: [number, number, number]) =>
        "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
      return { fg: hex(fg), bg: hex(bg), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
    },
    [selector, part] as const,
  );
}

// The element that has focus, described for an assertion message.
export function focused(page: PageLike): Promise<string> {
  return run(page).evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return "body";
    const name = el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 40) ?? "";
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} "${name}"`;
  });
}

// Catches the next submit of a form under `root` (a selector), stops it, and resolves with what the
// browser would have posted: the method, the encoding and every field, a file as "file:<name>". For
// a spec that checks a component's forms work with no script.
export function nextPost(
  page: PageLike,
  root: string,
): Promise<{ method: string; enctype: string; fields: Record<string, string[]> }> {
  return run(page).evaluate(
    (sel) =>
      new Promise<{ method: string; enctype: string; fields: Record<string, string[]> }>((done) => {
        document.querySelector(sel)!.addEventListener(
          "submit",
          (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const data = new FormData(form, (e as SubmitEvent).submitter);
            const fields: Record<string, string[]> = {};
            for (const k of new Set(data.keys()))
              fields[k] = data.getAll(k).map((v) => (typeof v === "string" ? v : `file:${v.name}`));
            done({ method: form.method, enctype: form.enctype, fields });
          },
          { capture: true, once: true },
        );
      }),
    root,
  );
}

// A focused row's ring is an inset outline over the row's own --sel tint, so its contrast is the
// outline color against the row's background (paintedContrast measures an outline against the
// parent's background, which is not what the eye sees there).
export function ringContrast(
  page: PageLike,
  sel: string,
): Promise<{ ring: string; bg: string; ratio: number; width: string } | null> {
  return run(page).evaluate((s) => {
    const el = document.querySelector<HTMLElement>(s);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const rgb = (v: string) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const lum = (c: number[]) => {
      const f = (x: number) => {
        const t = x / 255;
        return t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c[0] ?? 0) + 0.7152 * f(c[1] ?? 0) + 0.0722 * f(c[2] ?? 0);
    };
    const a = lum(rgb(cs.outlineColor));
    const b = lum(rgb(cs.backgroundColor));
    return {
      ring: cs.outlineColor,
      bg: cs.backgroundColor,
      width: cs.outlineWidth,
      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    };
  }, sel);
}

// How many CSS rules the page's stylesheets hold, nested ones (@layer, @media, native nesting)
// included. A stylesheet that failed to load leaves the page unstyled, and every layout check
// after it then measures browser defaults: assert a floor, set well under a measured run, first.
// A cross-origin sheet cannot be read and counts zero.
export function countCssRules(page: PageLike): Promise<number> {
  return run(page).evaluate(() => {
    const count = (rules: CSSRuleList): number =>
      [...rules].reduce(
        (n, r) => n + 1 + ("cssRules" in r ? count((r as CSSGroupingRule).cssRules) : 0),
        0,
      );
    return [...document.styleSheets].reduce((n, sheet) => {
      try {
        return n + count(sheet.cssRules);
      } catch {
        return n;
      }
    }, 0);
  });
}

// What sticks out of a list row, or leaves its title under 100px to be read: an empty list is a fit.
export function rowOverflow(page: PageLike): Promise<string[]> {
  return run(page).evaluate(() => {
    const out: string[] = [];
    for (const row of document.querySelectorAll<HTMLElement>("li.cap-row")) {
      const r = row.getBoundingClientRect();
      if (r.width === 0) continue;
      for (const el of row.querySelectorAll<HTMLElement>("*")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0 || el.closest("[hidden], .cap-sr-only")) continue;
        if (b.right > r.right + 1 || b.left < r.left - 1)
          out.push(`${row.id} ${el.className || el.tagName} sticks out of its row`);
      }
      const t = row.querySelector<HTMLElement>(".cap-row-title");
      if (t && t.getBoundingClientRect().width < 100)
        out.push(`${row.id} title is ${Math.round(t.getBoundingClientRect().width)}px wide`);
    }
    return out;
  });
}
