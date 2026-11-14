import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CHECK_WIDTHS, overflowScan, paintedContrast, settled, shellState } from "./page.js";
// The page helpers need no test runner: they are in ./page (capsomer/testing/page), and here too.
export * from "./page.js";
// Shared by every component's spec. A spec calls `eachTheme` and, inside it, names its
// tests with one of the prefixes below; the site's test panel groups results by prefix.
//   "keyboard: ..."       a key does what the doc page's keyboard table says
//   "accessibility: ..."  the axe scan, the ARIA snapshot, painted contrast
//   "behavior: ..."      anything else the component promises
export const THEMES = ["light", "dark"];
// Runs `body` once per theme, with the browser's color scheme and the page's data-theme
// both set, so a component is checked as each theme actually paints it. In the dark theme
// only the accessibility tests not tagged @markup run (playwright.config.ts, grepInvert).
export function eachTheme(body) {
    for (const theme of THEMES) {
        test.describe(`${theme} theme`, () => {
            test.use({ colorScheme: theme });
            body(theme);
        });
    }
}
// The contrast ratio of two CSS colors as the browser paints them (a canvas pixel, so any
// color syntax works). visitStates installs it, for checks that run inside the page.
function installRatio() {
    const lum = (c) => {
        const x = document.createElement("canvas").getContext("2d");
        x.fillStyle = c;
        x.fillRect(0, 0, 1, 1);
        const [r, g, b] = [...x.getImageData(0, 0, 1, 1).data]
            .map((v) => v / 255)
            .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    window.capRatio = (a, b) => {
        const [x, y] = [lum(a), lum(b)];
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
}
// Opens a component's states page in the given theme and waits for its fonts and its frames.
// With `only`, opens one page-level specimen (a <template data-specimen>) as the whole page.
export async function visitStates(page, name, theme, only) {
    const q = new URLSearchParams({ theme });
    if (only)
        q.set("only", only);
    await page.goto(`components/${name}/states.html?${q}`);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.evaluate(installRatio);
    if (only)
        return;
    await expect(page.locator("h1").first()).toBeVisible();
    // A specimen frame whose demo sets itself up after load (the markdown editor's open palette) takes
    // focus when it does, and focus in a frame leaves the page under test: wait for every frame to finish.
    await page.waitForFunction(() => [...document.querySelectorAll("iframe.cap-specimen-frame")].every((f) => f.contentDocument?.documentElement.hasAttribute("data-specimen-ready")));
}
// Serves a component's states page with Trusted Types enforced for the `capsomer` policy alone (the policy a site
// stages), and returns the list every violation is pushed to, for a spec that expects it to stay empty.
export async function enforceTrustedTypes(page, name) {
    await page.route(`**/components/${name}/states.html*`, async (route) => {
        const response = await route.fetch();
        await route.fulfill({
            response,
            headers: {
                ...response.headers(),
                "content-security-policy": "require-trusted-types-for 'script'; trusted-types capsomer",
            },
        });
    });
    const violations = [];
    page.on("console", (m) => {
        if (m.type() === "error" && /Trusted ?Type/i.test(m.text()))
            violations.push(m.text());
    });
    await page.addInitScript(() => document.addEventListener("securitypolicyviolation", (e) => console.error(`Trusted Types violation: ${e.violatedDirective} ${e.sample}`)));
    return violations;
}
// The automated scan, against WCAG 2.2 A and AA. Any violation fails, with its rule, its
// impact and the first offending node in the message, so a failure says where to look.
// Base UI's focus guards are visually hidden sentinels it places around an open popup on
// purpose: aria-hidden and focusable so focus can wrap. axe's aria-hidden-focus rule flags
// them; `baseUi: true` leaves exactly those elements out of the scan and nothing else.
// `exclude` leaves one element out, for a state the scan misreads; `disableRules` turns rules
// off for a mode they misread. Say why where either is used.
export async function expectNoAxeViolations(page, include, options = {}) {
    let builder = new AxeBuilder({ page }).withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22aa",
    ]);
    if (include)
        builder = builder.include(include);
    // A states page that shows open popups in <iframe> frames is scanned frame by frame, by the
    // tests that visit each frame on its own, so those frames are left out of the page scan.
    if (options.baseUi)
        builder = builder.exclude("[data-base-ui-focus-guard]").exclude("iframe");
    if (options.exclude)
        builder = builder.exclude(options.exclude);
    if (options.disableRules)
        builder = builder.disableRules(options.disableRules);
    // axe reads colors as painted. A dialog fading in, or a control mid-transition, is read
    // blended with what is behind it, so wait for every finite animation and transition to end
    // first (the first CI run caught a danger button at 4.18:1 for this reason).
    await settled(page);
    const { violations } = await builder.analyze();
    const found = violations.map((v) => `${v.id} (${v.impact}): ${v.help}. First at ${v.nodes[0]?.target.join(" ")} (${v.nodes.length} nodes). ${(v.nodes[0]?.failureSummary ?? "").replace(/\s+/g, " ").trim()}`);
    expect(found, "axe violations").toEqual([]);
}
// Every selector must match and reach its bar. A missing element fails rather than
// passing vacuously.
export async function expectContrast(page, checks) {
    const low = [];
    for (const c of checks) {
        const r = await paintedContrast(page, c.sel, c.part ?? "color");
        expect(r, `${c.what} (${c.sel}) is on the page`).not.toBeNull();
        const min = c.min ?? (c.part && c.part !== "color" ? 3 : 4.5);
        if (r && r.ratio < min)
            low.push(`${c.what}: ${r.fg} on ${r.bg} is ${r.ratio.toFixed(2)}:1, needs ${min}:1`);
    }
    expect(low).toEqual([]);
}
// No page scrolls sideways at any of the check widths (WCAG 1.4.10, reflow).
export async function expectNoOverflow(page, widths = CHECK_WIDTHS) {
    const height = page.viewportSize()?.height ?? 900;
    for (const width of widths) {
        await page.setViewportSize({ width, height });
        expect(await overflowScan(page), `at ${width}px`).toEqual([]);
    }
}
// Every admin path draws the shell with its stylesheet. `signIn` is the path a bounced session lands on.
export async function expectShellRenders(page, paths, { signIn = "/login" } = {}) {
    for (const path of paths) {
        await page.goto(path);
        const s = await shellState(page);
        expect(s.path, `${path} bounced to sign-in`).not.toBe(signIn);
        expect(s.menu && s.bar && s.styled, `${path} draws the admin shell`).toBe(true);
        expect(s.text, `${path} has a body`).toBeGreaterThan(100);
    }
}
