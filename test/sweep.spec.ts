import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { inlineCss } from "../bin/build.mjs";
import { THEMES, expectNoAxeViolations, settled, visitStates } from "./helpers.ts";
import { FIXTURES_A } from "./sweep-fixtures-a.ts";
import { FIXTURES_B } from "./sweep-fixtures-b.ts";
import { install, type Shape } from "./sweep-checks.ts";

// The sweep: every component's states page and each of its page-level specimens, checked for
// what every component owes and no component spec has to repeat. A failure names the
// component, the page (its specimen id) and the element.
//   reflow        320px wide, no sideways scroll outside a named scroll region (WCAG 1.4.10),
//                 and with dir="rtl" no element newly sticks out of its parent (physical
//                 left/right where a logical property belongs), at 320px and 1280px
//   text spacing  WCAG 1.4.12's overrides clip no text that fitted before
//   links         no link is underlined, and every text link is semibold (DEFAULTS.md); in both
//                 themes a text link in the link color has the base cues (components/link):
//                 a hover tint, a stronger pressed tint, a visited color, each 4.5:1 as painted;
//                 every data-link kind shows its mark, and no mark glyph reaches assistive
//                 technology (alt text, CSS content's "/ ..." part); in forced colors, too, the
//                 marks are drawn
//   targets       on a coarse pointer every target is 44 x 44, or at least 24 x 24 with no
//                 other target within 22px of its center (WCAG 2.5.8's spacing, at the 44px
//                 Capsomer promises on touch, tokens/scale.css)
//   forced colors axe-free, and every focusable element shows an outline on :focus-visible
//                 (a box-shadow or background ring is gone in forced colors), in both themes:
//                 Chromium follows the color scheme to a dark or a light system palette
//   React         a wrapper renders each of its classes with the role (written, or implied by
//                 the tag) and the naming the HTML contract (the doc page's markup and
//                 examples.html) gives it: in its React specimens, or for a wrapper with none,
//                 in one fixture rendered on the server (FIXTURES)
// Geometry does not depend on the palette, so reflow, spacing, targets and React run once, in
// the light theme (playwright.config.ts, grepInvert).

type Spot = { name: string; only?: string };
// CAPSOMER_SWEEP=button,menu sweeps only those: CI on a pull request names the components it
// touched (scripts/ci-specs.mjs). Unset or empty, every component.
const ONLY = (process.env.CAPSOMER_SWEEP ?? "").split(",").filter(Boolean);
const NAMES = readdirSync("components", { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`components/${d.name}/examples.html`))
  .map((d) => d.name)
  .filter((name) => !ONLY.length || ONLY.includes(name));
function spots(name: string): Spot[] {
  const html = readFileSync(`components/${name}/examples.html`, "utf8");
  return [
    { name },
    ...[...html.matchAll(/<template\b[^>]*\bdata-specimen="([^"]+)"/g)].map((m) => ({
      name,
      only: m[1],
    })),
  ];
}
const where = (s: Spot) => (s.only ? `${s.name} ?only=${s.only}` : `${s.name} states page`);

const AXE_EXCLUDE: Record<string, string> = { "admin-shell/tip": ".cap-admin-tip:popover-open" };

// Opens a page, waits for React mounts and finite animations, and installs the checks.
async function open(page: Page, s: Spot, theme: (typeof THEMES)[number] = "light"): Promise<void> {
  await visitStates(page, s.name, theme, s.only);
  await page
    .waitForFunction(
      () => [...document.querySelectorAll("[data-mount]")].every((m) => m.childElementCount > 0),
      undefined,
      { timeout: 5_000 },
    )
    .catch(() => undefined);
  await settled(page);
  await page.evaluate(install);
}
// Resolves once nothing on the page moves: no finite animation runs, two frames on. A resize can
// set off a chain (the media library's inspector leaves the page as a pane, then comes back as a
// sheet), each step starting after the one before, so one wait for the running animations is not enough.
function still(page: Page): Promise<void> {
  return page.evaluate(async () => {
    const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (;;) {
      await frames();
      const moving = document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === "running" &&
            Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity),
        );
      if (moving.length === 0) return;
      await Promise.all(moving.map((a) => a.finished.catch(() => undefined)));
    }
  });
}
// Left to right, then right to left, from the same moment.
const rtl = (page: Page) =>
  page.evaluate(() => (window.__sweep.rtl("ltr"), window.__sweep.rtl("rtl")));
const tag = (s: Spot, found: string[]) => found.map((f) => `${where(s)}: ${f}`);

for (const name of NAMES) {
  const pages = spots(name);
  test.describe(name, () => {
    test.describe.configure({ timeout: 30_000 + pages.length * 15_000 });

    test("accessibility: sweep: reflows at 320px, and right to left nothing sticks out", async ({
      page,
    }) => {
      const found: string[] = [];
      for (const s of pages) {
        await page.setViewportSize({ width: 1280, height: 800 });
        await open(page, s);
        found.push(...tag(s, await rtl(page)));
        await page.setViewportSize({ width: 320, height: 640 });
        await still(page);
        found.push(...tag(s, await page.evaluate(() => window.__sweep.reflow())));
        found.push(...tag(s, await rtl(page)));
      }
      expect(found).toEqual([]);
    });

    test("accessibility: sweep: text spacing clips no text (WCAG 1.4.12), and links have their cues", async ({
      page,
    }) => {
      const found: string[] = [];
      for (const s of pages) {
        // Painted contrast needs both themes; the page's data-theme switches the tokens.
        await open(page, s, "dark");
        found.push(
          ...tag(s, await page.evaluate(() => window.__sweep.kinds(false))).map(
            (f) => `dark: ${f}`,
          ),
        );
        await open(page, s);
        found.push(...tag(s, await page.evaluate(() => window.__sweep.links())));
        found.push(...tag(s, await page.evaluate(() => window.__sweep.kinds(false))));
        await page.evaluate(() => window.__sweep.spacing("before"));
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );
        found.push(...tag(s, await page.evaluate(() => window.__sweep.spacing("after"))));
      }
      expect(found).toEqual([]);
    });

    test.describe(() => {
      test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
      test("accessibility: sweep: targets on a coarse pointer (WCAG 2.5.8)", async ({ page }) => {
        const found: string[] = [];
        for (const s of pages) {
          await open(page, s);
          expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
          found.push(...tag(s, await page.evaluate(() => window.__sweep.targets())));
        }
        expect(found).toEqual([]);
      });
    });

    for (const theme of THEMES) {
      test.describe(`${theme} theme`, () => {
        test.use({ colorScheme: theme, forcedColors: "active" });
        test("accessibility: sweep: forced colors: no axe violations, and focus shows an outline", async ({
          page,
        }) => {
          const found: string[] = [];
          for (const s of pages) {
            await open(page, s, theme);
            // Not color-contrast: in forced colors the person's palette paints every color, and axe reads
            // the author's colors the browser no longer paints. Contrast is scanned in both themes by every
            // component's own axe test.
            const misread = AXE_EXCLUDE[`${s.name}/${s.only}`];
            if (misread)
              await page.evaluate(
                (sel) =>
                  document
                    .querySelector(sel)
                    ?.closest(".cap-admin-tile")
                    ?.setAttribute("data-tip-open", ""),
                misread,
              );
            // Without color-contrast, axe reads only the DOM, which the theme does not change: one
            // theme's scan stands for both. The rings and kinds below read paint, so they run in both.
            if (theme === "light")
              await expectNoAxeViolations(page, undefined, {
                baseUi: true,
                exclude: misread ? "[data-tip-open]" : undefined,
                disableRules: ["color-contrast"],
              });
            found.push(...tag(s, await page.evaluate(() => window.__sweep.rings())));
            found.push(...tag(s, await page.evaluate(() => window.__sweep.kinds(true))));
            // A person's look at what no check reads: a state drawn only by a background or a
            // shadow, which forced colors removes. Kept with the run (ci.yml), never compared.
            if (theme === "light" && !s.only) {
              mkdirSync("test-results/forced-colors", { recursive: true });
              await page.screenshot({
                path: `test-results/forced-colors/${name}.png`,
                fullPage: true,
              });
            }
          }
          expect(found).toEqual([]);
        });
      });
    }

    const fixture = { ...FIXTURES_A, ...FIXTURES_B }[name];
    // The parity check compares the classes a component's CSS owns. One with no CSS (json-ld's
    // data block, which is never drawn) owns no class, so there is nothing to compare.
    if (
      existsSync(`components/${name}/${name}.css`) &&
      (existsSync(`components/${name}/examples.tsx`) || fixture)
    ) {
      test("behavior: sweep: the React wrapper renders the HTML contract's elements, roles and names", async ({
        page,
      }) => {
        // With its imports read in: site-header.css is its frame, letterhead and search parts.
        const css = inlineCss(`components/${name}/${name}.css`);
        const own = [...new Set([...css.matchAll(/\.(cap-[\w-]+)/g)].map((m) => m[1] as string))];
        const md = readFileSync(`components/${name}/${name}.md`, "utf8");
        const contract = [
          readFileSync(`components/${name}/examples.html`, "utf8").replace(
            /<template\b[^>]*>|<\/template>/g,
            "",
          ),
          ...[...md.matchAll(/```html\n([\s\S]*?)```/g)].map((m) => m[1] as string),
        ];
        const rendered: (Shape & { at: string })[] = [];
        let html: Shape[] = [];
        if (fixture) {
          await open(page, { name });
          html = await page.evaluate(([h, o]) => window.__sweep.contractShape(h, o, ""), [
            contract,
            own,
          ] as const);
          const markup = renderToStaticMarkup(fixture());
          rendered.push(
            ...(
              await page.evaluate(([m, o]) => window.__sweep.contractShape(m, o, ""), [
                [markup] as string[],
                own,
              ] as const)
            ).map((r) => ({ ...r, at: `${name} fixture` })),
          );
        } else {
          // Where React renders: every data-mount, and each element examples.tsx finds by id.
          const tsx = readFileSync(`components/${name}/examples.tsx`, "utf8");
          const ids = [
            ...new Set([...tsx.matchAll(/"([a-z][\w-]*)"/g)].map((m) => m[1] as string)),
          ].filter((id) => contract[0]?.includes(`id="${id}"`));
          const roots = ["[data-mount]", ...ids.map((id) => `#${id}`)].join(", ");
          for (const s of pages) {
            await open(page, s);
            if (!html.length)
              html = await page.evaluate(([h, o, r]) => window.__sweep.contractShape(h, o, r), [
                contract,
                own,
                roots,
              ] as const);
            rendered.push(
              ...(
                await page.evaluate(([o, r]) => window.__sweep.reactShape(o, r), [
                  own,
                  roots,
                ] as const)
              ).map((r) => ({ ...r, at: where(s) })),
            );
          }
        }
        expect(rendered.length, "the React specimens rendered").toBeGreaterThan(0);
        const found = new Set<string>();
        for (const r of rendered) {
          const same = html.filter((h) => h.cls === r.cls);
          if (!same.length) continue; // a class the HTML contract never shows: nothing to compare
          const match = same.filter((h) => h.role === r.role);
          if (!match.length)
            found.add(
              `${r.at}: React renders .${r.cls} as <${r.tag}> (${r.role}), the contract as ${[...new Set(same.map((h) => `<${h.tag}> (${h.role})`))].join(" or ")}`,
            );
          else if (match.every((h) => h.named) && !r.named)
            found.add(
              `${r.at}: React's .${r.cls} has no aria-label or aria-labelledby; the contract's always has one`,
            );
        }
        expect([...found]).toEqual([]);
      });
    }
  });
}
