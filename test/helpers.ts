import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Shared by every component's spec. A spec calls `eachTheme` and, inside it, names its
// tests with one of the prefixes below; the site's test panel groups results by prefix.
//   "keyboard: ..."       a key does what the doc page's keyboard table says
//   "accessibility: ..."  the axe scan, the ARIA snapshot, painted contrast
//   "behavior: ..."      anything else the component promises

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

// Runs `body` once per theme, with the browser's color scheme and the page's data-theme
// both set, so a component is checked as each theme actually paints it. In the dark theme
// only the accessibility tests not tagged @markup run (playwright.config.ts, grepInvert).
export function eachTheme(body: (theme: Theme) => void): void {
  for (const theme of THEMES) {
    test.describe(`${theme} theme`, () => {
      test.use({ colorScheme: theme });
      body(theme);
    });
  }
}

declare global {
  interface Window {
    capRatio(a: string, b: string): number;
  }
}

// The contrast ratio of two CSS colors as the browser paints them (a canvas pixel, so any
// color syntax works). visitStates installs it, for checks that run inside the page.
function installRatio(): void {
  const lum = (c: string) => {
    const x = document.createElement("canvas").getContext("2d")!;
    x.fillStyle = c;
    x.fillRect(0, 0, 1, 1);
    const [r, g, b] = [...x.getImageData(0, 0, 1, 1).data]
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  window.capRatio = (a, b) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
}

// Opens a component's states page in the given theme and waits for its fonts and its frames.
// With `only`, opens one page-level specimen (a <template data-specimen>) as the whole page.
export async function visitStates(
  page: Page,
  name: string,
  theme: Theme,
  only?: string,
): Promise<void> {
  const q = new URLSearchParams({ theme });
  if (only) q.set("only", only);
  await page.goto(`components/${name}/states.html?${q}`);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.evaluate(installRatio);
  if (only) return;
  await expect(page.locator("h1").first()).toBeVisible();
  // A specimen frame whose demo sets itself up after load (the markdown editor's open palette) takes
  // focus when it does, and focus in a frame leaves the page under test: wait for every frame to finish.
  await page.waitForFunction(() =>
    [...document.querySelectorAll<HTMLIFrameElement>("iframe.cap-specimen-frame")].every((f) =>
      f.contentDocument?.documentElement.hasAttribute("data-specimen-ready"),
    ),
  );
}

// The automated scan, against WCAG 2.2 A and AA. Any violation fails, with its rule, its
// impact and the first offending node in the message, so a failure says where to look.
// Base UI's focus guards are visually hidden sentinels it places around an open popup on
// purpose: aria-hidden and focusable so focus can wrap. axe's aria-hidden-focus rule flags
// them; `baseUi: true` leaves exactly those elements out of the scan and nothing else.
// `exclude` leaves one element out, for a state the scan misreads; `disableRules` turns rules
// off for a mode they misread. Say why where either is used.
export async function expectNoAxeViolations(
  page: Page,
  include?: string,
  options: { baseUi?: boolean; exclude?: string; disableRules?: string[] } = {},
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  if (include) builder = builder.include(include);
  // A states page that shows open popups in <iframe> frames is scanned frame by frame, by the
  // tests that visit each frame on its own, so those frames are left out of the page scan.
  if (options.baseUi) builder = builder.exclude("[data-base-ui-focus-guard]").exclude("iframe");
  if (options.exclude) builder = builder.exclude(options.exclude);
  if (options.disableRules) builder = builder.disableRules(options.disableRules);
  // axe reads colors as painted. A dialog fading in, or a control mid-transition, is read
  // blended with what is behind it, so wait for every finite animation and transition to end
  // first (the first CI run caught a danger button at 4.18:1 for this reason).
  await settled(page);
  const { violations } = await builder.analyze();
  const found = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}. First at ${v.nodes[0]?.target.join(" ")} (${v.nodes.length} nodes). ${(v.nodes[0]?.failureSummary ?? "").replace(/\s+/g, " ").trim()}`,
  );
  expect(found, "axe violations").toEqual([]);
}

// Resolves once every finite animation and transition on the page has ended: what is measured
// then is what stays on screen.
export function settled(page: Page): Promise<void> {
  return page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity))
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
  page: Page,
  selector: string,
  part: "color" | "border" | "outline" = "color",
): Promise<Reading | null> {
  return page.evaluate(
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

// Every selector must match and reach its bar. A missing element fails rather than
// passing vacuously.
export async function expectContrast(
  page: Page,
  checks: Array<{ sel: string; what: string; part?: "color" | "border" | "outline"; min?: number }>,
): Promise<void> {
  const low: string[] = [];
  for (const c of checks) {
    const r = await paintedContrast(page, c.sel, c.part ?? "color");
    expect(r, `${c.what} (${c.sel}) is on the page`).not.toBeNull();
    const min = c.min ?? (c.part && c.part !== "color" ? 3 : 4.5);
    if (r && r.ratio < min)
      low.push(`${c.what}: ${r.fg} on ${r.bg} is ${r.ratio.toFixed(2)}:1, needs ${min}:1`);
  }
  expect(low).toEqual([]);
}

// The element that has focus, described for an assertion message.
export function focused(page: Page): Promise<string> {
  return page.evaluate(() => {
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
  page: Page,
  root: string,
): Promise<{ method: string; enctype: string; fields: Record<string, string[]> }> {
  return page.evaluate(
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
  page: Page,
  sel: string,
): Promise<{ ring: string; bg: string; ratio: number; width: string } | null> {
  return page.evaluate((s) => {
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

// What sticks out of a list row, or leaves its title under 100px to be read: an empty list is a fit.
export function rowOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
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

// Site-level checks, shared so every site's browser suite asks the same questions of Capsomer's parts. Each page
// function runs inside the page through `evaluate` and is self-contained, so a Puppeteer suite passes the same
// function to its own page.evaluate.

// The widths every page is held at: the smallest phone (WCAG 1.4.10's 320), a common phone, Capsomer's breakpoints
// (tokens.json `breakpoint`: 40rem, 48rem, 64rem, 72rem) and a desktop.
export const CHECK_WIDTHS = [320, 375, 640, 768, 1024, 1152, 1280] as const;

// The reachable CSS rules: proof a page's stylesheets arrived (a cross-origin sheet throws on cssRules, counts zero).
export function countCssRules(): number {
  return [...document.styleSheets].reduce((n, s) => {
    try {
      return n + s.cssRules.length;
    } catch {
      return n;
    }
  }, 0);
}

// The first elements reaching past the document's right edge, as tag.class@right. Anything left of -1000px is
// off-screen by design (a skip link, a closed drawer translated out of view).
export function overflowScan(): string[] {
  const width = document.documentElement.clientWidth;
  const over: string[] = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.left < -1000 || r.width === 0) continue;
    if (r.right > width + 0.5) {
      const cls = typeof el.className === "string" ? el.className.split(/\s+/)[0] : "";
      over.push(`${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}@${Math.round(r.right)}`);
      if (over.length === 4) break;
    }
  }
  return over;
}

// No page scrolls sideways at any of the check widths (WCAG 1.4.10, reflow).
export async function expectNoOverflow(
  page: Page,
  widths: readonly number[] = CHECK_WIDTHS,
): Promise<void> {
  const height = page.viewportSize()?.height ?? 900;
  for (const width of widths) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(overflowScan), `at ${width}px`).toEqual([]);
  }
}

// Whether the admin shell is drawn: its menu and bar present and laid out by Capsomer's CSS (a rail the browser drew
// unstyled is a full-width block), the session not bounced to a sign-in page, and a real body under it.
export function shellState(): {
  menu: boolean;
  bar: boolean;
  styled: boolean;
  text: number;
  path: string;
} {
  const menu = document.querySelector(".cap-admin-menu");
  const style = menu ? getComputedStyle(menu) : null;
  return {
    menu: !!menu,
    bar: !!document.querySelector(".cap-admin-bar"),
    styled:
      !!style &&
      style.display !== "inline" &&
      parseFloat(style.width) > 0 &&
      parseFloat(style.width) < innerWidth,
    text: (document.body.innerText || "").trim().length,
    path: location.pathname,
  };
}

// Every admin path draws the shell with its stylesheet. `signIn` is the path a bounced session lands on.
export async function expectShellRenders(
  page: Page,
  paths: readonly string[],
  { signIn = "/login" }: { signIn?: string } = {},
): Promise<void> {
  for (const path of paths) {
    await page.goto(path);
    const s = await page.evaluate(shellState);
    expect(s.path, `${path} bounced to sign-in`).not.toBe(signIn);
    expect(s.menu && s.bar && s.styled, `${path} draws the admin shell`).toBe(true);
    expect(s.text, `${path} has a body`).toBeGreaterThan(100);
  }
}

// The theme's head contract, on a page's HTML as served: a color-scheme meta, before the first stylesheet, so the
// browser paints the right canvas before any CSS arrives. Returns the problems in words.
export function headContractProblems(html: string, scheme?: string): string[] {
  const meta = /<meta name="color-scheme" content="([^"]*)"/.exec(html);
  const sheet = html.search(/<link[^>]+rel="stylesheet"/);
  const problems: string[] = [];
  if (!meta) return ["no color-scheme meta"];
  if (scheme && meta[1] !== scheme)
    problems.push(`color-scheme is "${meta[1]}", expected "${scheme}"`);
  if (sheet !== -1 && meta.index > sheet)
    problems.push("the color-scheme meta comes after the first stylesheet");
  return problems;
}

// What a page loads with script off and motion reduced: no running animation or transition longer than a frame
// (Capsomer's motion is written inside prefers-reduced-motion: no-preference, and base.css catches the rest).
export function runningMotion(): string[] {
  const out: string[] = [];
  for (const a of document.getAnimations()) {
    const timing = a.effect?.getComputedTiming();
    const ms = Number(timing?.duration ?? 0) * (Number(timing?.iterations ?? 1) || 1);
    if (ms > 16) {
      const t = (a.effect as KeyframeEffect | null)?.target;
      out.push(
        `${t?.tagName.toLowerCase() ?? "?"}${t?.className ? `.${String(t.className).split(/\s+/)[0]}` : ""}: ${Math.round(ms)}ms`,
      );
    }
  }
  return out;
}

// No script module named `pattern` has loaded yet (a lazy part, such as the command menu, must wait for its key).
export function loadedScripts(pattern: string): string[] {
  const re = new RegExp(pattern);
  return performance
    .getEntriesByType("resource")
    .map((e) => e.name)
    .filter((name) => re.test(name));
}
