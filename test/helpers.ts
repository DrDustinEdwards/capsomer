import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Shared by every component's spec. A spec calls `eachTheme` and, inside it, names its
// tests with one of the prefixes below; the site's test panel groups results by prefix.
//   "keyboard: ..."       a key does what the doc page's keyboard table says
//   "accessibility: ..."  the axe scan, the ARIA snapshot, painted contrast
//   "behaviour: ..."      anything else the component promises

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

// Runs `body` once per theme, with the browser's colour scheme and the page's data-theme
// both set, so a component is checked as each theme actually paints it.
export function eachTheme(body: (theme: Theme) => void): void {
  for (const theme of THEMES) {
    test.describe(`${theme} theme`, () => {
      test.use({ colorScheme: theme });
      body(theme);
    });
  }
}

// Opens a component's states page in the given theme and waits for its fonts.
// With `only`, opens one page-level specimen (a <template data-specimen>) as the whole page.
export async function visitStates(page: Page, name: string, theme: Theme, only?: string): Promise<void> {
  const q = new URLSearchParams({ theme });
  if (only) q.set("only", only);
  await page.goto(`components/${name}/states.html?${q}`);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  if (!only) await expect(page.locator("h1").first()).toBeVisible();
}

// The automated scan, against WCAG 2.2 A and AA. Any violation fails, with its rule, its
// impact and the first offending node in the message, so a failure says where to look.
// Base UI's focus guards are visually hidden sentinels it places around an open popup on
// purpose: aria-hidden and focusable so focus can wrap. axe's aria-hidden-focus rule flags
// them; `baseUi: true` leaves exactly those elements out of the scan and nothing else.
export async function expectNoAxeViolations(page: Page, include?: string, options: { baseUi?: boolean } = {}): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  if (include) builder = builder.include(include);
  // A states page that shows open popups in <iframe> frames is scanned frame by frame, by the
  // tests that visit each frame on its own, so those frames are left out of the page scan.
  if (options.baseUi) builder = builder.exclude("[data-base-ui-focus-guard]").exclude("iframe");
  // axe reads colours as painted. A dialog fading in, or a control mid-transition, is read
  // blended with what is behind it, so wait for every finite animation and transition to end
  // first (the first CI run caught a danger button at 4.18:1 for this reason).
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity))
        .map((a) => a.finished.catch(() => undefined)),
    ).then(() => undefined),
  );
  const { violations } = await builder.analyze();
  const found = violations.map((v) => `${v.id} (${v.impact}): ${v.help}. First at ${v.nodes[0]?.target.join(" ")} (${v.nodes.length} nodes). ${(v.nodes[0]?.failureSummary ?? "").replace(/\s+/g, " ").trim()}`);
  expect(found, "axe violations").toEqual([]);
}

export interface Reading {
  fg: string;
  bg: string;
  ratio: number;
}

// Contrast as the browser paints it: the colour of the element (its text, or its border)
// against the first opaque background behind it, compositing translucent layers. From the
// Capsid Portal's contrast spec, where it caught a selected row at 1.06:1.
export function paintedContrast(page: Page, selector: string, part: "color" | "border" | "outline" = "color"): Promise<Reading | null> {
  return page.evaluate(
    ([sel, which]) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return null;
      const parse = (s: string): [number, number, number, number] => {
        const m = s.match(/rgba?\(([^)]+)\)/);
        const inner = m?.[1];
        if (!inner) return [0, 0, 0, 0];
        const p = inner.split(/[\s,/]+/).filter(Boolean).map(Number);
        return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0, p.length > 3 ? (p[3] ?? 1) : 1];
      };
      const over = (top: [number, number, number, number], under: [number, number, number]): [number, number, number] => {
        const a = top[3];
        return [Math.round(top[0] * a + under[0] * (1 - a)), Math.round(top[1] * a + under[1] * (1 - a)), Math.round(top[2] * a + under[2] * (1 - a))];
      };
      let bg: [number, number, number] = [255, 255, 255];
      const layers: [number, number, number, number][] = [];
      for (let n: HTMLElement | null = which === "color" ? el : el.parentElement; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c[3] > 0) layers.unshift(c);
        if (c[3] >= 1) break;
      }
      if (layers.length === 0 || (layers[0]?.[3] ?? 0) < 1) layers.unshift(parse(getComputedStyle(document.body).backgroundColor));
      for (const l of layers) bg = over(l, bg);
      const cs = getComputedStyle(el);
      const fgRaw = parse(which === "color" ? cs.color : which === "border" ? cs.borderTopColor : cs.outlineColor);
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
      const hex = (c: [number, number, number]) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
      return { fg: hex(fg), bg: hex(bg), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
    },
    [selector, part] as const,
  );
}

// Every selector must match and reach its bar. A missing element fails rather than
// passing vacuously.
export async function expectContrast(page: Page, checks: Array<{ sel: string; what: string; part?: "color" | "border" | "outline"; min?: number }>): Promise<void> {
  const low: string[] = [];
  for (const c of checks) {
    const r = await paintedContrast(page, c.sel, c.part ?? "color");
    expect(r, `${c.what} (${c.sel}) is on the page`).not.toBeNull();
    const min = c.min ?? (c.part && c.part !== "color" ? 3 : 4.5);
    if (r && r.ratio < min) low.push(`${c.what}: ${r.fg} on ${r.bg} is ${r.ratio.toFixed(2)}:1, needs ${min}:1`);
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
export function nextPost(page: Page, root: string): Promise<{ method: string; enctype: string; fields: Record<string, string[]> }> {
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
            for (const k of new Set(data.keys())) fields[k] = data.getAll(k).map((v) => (typeof v === "string" ? v : `file:${v.name}`));
            done({ method: form.method, enctype: form.enctype, fields });
          },
          { capture: true, once: true },
        );
      }),
    root,
  );
}
