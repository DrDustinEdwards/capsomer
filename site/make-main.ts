// The theme builder's script (site/make.ts writes the page). Every change rebuilds the theme with
// Capsomer's own generator (tokens/palette-core.mjs, the code that writes Capsomer's color files),
// paints both previews through the CSSOM (the CSP allows no inline style), checks every pair, and
// rewrites the CSS, the tokens file and the address, so a link opens the same theme.
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import { enhance as enhanceMeters } from "../components/meter/meter.ts";
import { enhance as enhanceHeader } from "../components/site-header/site-header.ts";
import { enhance as enhanceTabs } from "../components/tabs/tabs.ts";
import { enhance as enhanceTheme } from "../components/theme-switch/theme-switch.ts";
import { CHART_ORDER, ELEVATION_ORDER, FAMILY_ORDER, familyTheme, oklch, pairs, renderFamily, renderScoped, seedLch, type Pair, type Tokens } from "../tokens/palette-core.mjs";
import { DEFAULT, DENSITY, DISPLAY_FACES, FACES, MONO_FACES, PRESETS, SIZES, TEXT_FACES, corners, sizes, type Density, type Label, type Settings } from "./make-presets.ts";

enhanceHeader();
enhanceTheme();
enhanceTabs();
enhanceMeters();

type Scheme = "light" | "dark";
const SCHEMES: Scheme[] = ["light", "dark"];
const HEX = /^#?([0-9a-f]{6})$/i;
const hex = (v: string | null | undefined) => {
  const m = HEX.exec((v ?? "").trim());
  return m ? `#${(m[1] as string).toLowerCase()}` : null;
};
const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const part = <T extends Element = HTMLElement>(name: string) => $<T>(`[data-cap-part='${name}']`);
const el = (tag: string, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

// ---- the theme -----------------------------------------------------------------------------

interface Built {
  s: Settings;
  label: "light" | "dark";
  t: Record<Scheme, Tokens>;
  p: Record<Scheme, Pair[]>;
  failing: number;
}

const failingFor = (seed: string, anchor: string | null, label: "light" | "dark") =>
  SCHEMES.reduce((n, scheme) => n + pairs(familyTheme(seed, anchor, scheme, label)).filter((x) => !x.pass).length, 0);

// "Best" takes whichever label leaves fewer failing pairs, light on a tie (Capsomer's default).
const resolveLabel = (s: Settings): "light" | "dark" =>
  s.label !== "auto" ? s.label : failingFor(s.seed, s.anchor, "dark") < failingFor(s.seed, s.anchor, "light") ? "dark" : "light";

function build(s: Settings): Built {
  const label = resolveLabel(s);
  const t = { light: familyTheme(s.seed, s.anchor, "light", label), dark: familyTheme(s.seed, s.anchor, "dark", label) };
  const p = { light: pairs(t.light), dark: pairs(t.dark) };
  return { s, label, t, p, failing: [...p.light, ...p.dark].filter((x) => !x.pass).length };
}

// Everything but color: faces, sizes, corners and density, as custom properties.
function shape(s: Settings): Record<string, string> {
  const ui = FACES[s.ui]?.stack ?? "";
  return {
    ui,
    "font-ui": ui,
    face: ui,
    display: FACES[s.display]?.stack ?? ui,
    mono: FACES[s.mono]?.stack ?? "",
    ...sizes(s.size, s.density),
    ...corners(s.radius),
    ...DENSITY[s.density],
  };
}

// ---- the settings, in the controls and in the address -----------------------------------------

const controls = {
  preset: $<HTMLSelectElement>("#mk-preset"),
  seed: $<HTMLInputElement>("#mk-seed"),
  seedPick: $<HTMLInputElement>("#mk-seed-pick"),
  seedError: $("#mk-seed-e"),
  anchorOn: $<HTMLInputElement>("#mk-anchor-on"),
  anchor: $<HTMLInputElement>("#mk-anchor"),
  anchorPick: $<HTMLInputElement>("#mk-anchor-pick"),
  anchorBox: part("anchor"),
  ui: $<HTMLSelectElement>("#mk-ui"),
  display: $<HTMLSelectElement>("#mk-display"),
  mono: $<HTMLSelectElement>("#mk-mono"),
  radius: $<HTMLInputElement>("#mk-radius"),
  radiusOut: $("#mk-radius-out"),
  name: $<HTMLInputElement>("#mk-name"),
};
const radio = (name: string) => $<HTMLInputElement>(`input[name='${name}']:checked`)?.value ?? "";
const setRadio = (name: string, value: string) => {
  const r = $<HTMLInputElement>(`input[name='${name}'][value='${value}']`);
  if (r) r.checked = true;
};

let last: Settings = DEFAULT;

function read(): Settings {
  const seed = hex(controls.seed?.value);
  controls.seedError?.toggleAttribute("hidden", Boolean(seed));
  controls.seed?.setAttribute("aria-invalid", String(!seed));
  const anchor = controls.anchorOn?.checked ? hex(controls.anchor?.value) : null;
  return {
    seed: seed ?? last.seed,
    anchor: controls.anchorOn?.checked ? (anchor ?? last.anchor) : null,
    label: (radio("mk-label") || "auto") as Label,
    ui: controls.ui?.value ?? DEFAULT.ui,
    display: controls.display?.value ?? DEFAULT.display,
    mono: controls.mono?.value ?? DEFAULT.mono,
    size: Number(radio("mk-size")) || DEFAULT.size,
    radius: Number(controls.radius?.value ?? DEFAULT.radius),
    density: (radio("mk-density") || "compact") as Density,
  };
}

function write(s: Settings) {
  for (const [input, pick, v] of [
    [controls.seed, controls.seedPick, s.seed],
    [controls.anchor, controls.anchorPick, s.anchor],
  ] as const) {
    if (v && input) input.value = v;
    if (v && pick) pick.value = v;
  }
  if (controls.anchorOn) controls.anchorOn.checked = Boolean(s.anchor);
  controls.anchorBox?.toggleAttribute("hidden", !s.anchor);
  controls.seedError?.setAttribute("hidden", "");
  controls.seed?.setAttribute("aria-invalid", "false");
  setRadio("mk-label", s.label);
  if (controls.ui) controls.ui.value = s.ui;
  if (controls.display) controls.display.value = s.display;
  if (controls.mono) controls.mono.value = s.mono;
  setRadio("mk-size", String(s.size));
  if (controls.radius) controls.radius.value = String(s.radius);
  setRadio("mk-density", s.density);
}

// The address keeps the settings after the #, short enough to paste.
function toHash(s: Settings): string {
  const q = new URLSearchParams({ c: s.seed.slice(1), l: s.label, ui: s.ui, h: s.display, m: s.mono, s: String(s.size), r: String(s.radius), d: s.density });
  if (s.anchor) q.set("a", s.anchor.slice(1));
  return q.toString();
}
function fromHash(h: string): Settings | null {
  const q = new URLSearchParams(h.replace(/^#/, ""));
  const seed = hex(q.get("c"));
  if (!seed) return null;
  const pick = <T extends string>(v: string | null, allowed: readonly T[], fallback: T) => (allowed.includes(v as T) ? (v as T) : fallback);
  const n = (v: string | null, lo: number, hi: number, fallback: number) => {
    const x = Number(v);
    return Number.isInteger(x) && x >= lo && x <= hi ? x : fallback;
  };
  return {
    seed,
    anchor: hex(q.get("a")),
    label: pick(q.get("l"), ["auto", "light", "dark"] as const, "auto"),
    ui: pick(q.get("ui"), TEXT_FACES, DEFAULT.ui),
    display: pick(q.get("h"), DISPLAY_FACES, DEFAULT.display),
    mono: pick(q.get("m"), MONO_FACES, DEFAULT.mono),
    size: SIZES.includes(Number(q.get("s"))) ? Number(q.get("s")) : DEFAULT.size,
    radius: n(q.get("r"), 0, 16, DEFAULT.radius),
    density: pick(q.get("d"), ["compact", "comfortable"] as const, "compact"),
  };
}
const shareUrl = (s: Settings) => `${location.origin}${location.pathname}#${toHash(s)}`;

// ---- painting ------------------------------------------------------------------------------

const TOKENS = [...FAMILY_ORDER, ...CHART_ORDER, ...ELEVATION_ORDER];

function paint(b: Built) {
  const look = shape(b.s);
  for (const scheme of SCHEMES) {
    const paneEl = $(`.make-pane[data-scheme='${scheme}']`);
    if (!paneEl) continue;
    for (const k of TOKENS) paneEl.style.setProperty(`--${k}`, b.t[scheme][k] ?? "");
    for (const [k, v] of Object.entries(look)) paneEl.style.setProperty(`--${k}`, v);
    paneEl.style.setProperty("color-scheme", scheme);
    paneEl.dataset.density = b.s.density;
    const row = $(`.make-scale[data-scheme='${scheme}']`);
    row?.querySelectorAll("li").forEach((li, i) => {
      const v = b.t[scheme][`accent-${i + 1}`] ?? "";
      li.querySelector("i")?.style.setProperty("background", v);
      const code = li.querySelector("code");
      if (code) code.textContent = v;
    });
  }
}

function fixFor(p: Pair, scheme: Scheme, b: Built): string {
  const other = b.label === "light" ? "dark" : "light";
  if (p.fg === "primary-fg") {
    return failingFor(b.s.seed, b.s.anchor, other) < b.failing ? `Choose ${other === "dark" ? "Dark" : "Light"} for the label on buttons.` : "Move the brand color further from the middle, so a label stands out on it.";
  }
  if (b.s.anchor && scheme === "light" && (p.fg === "accent-text" || p.fg === "accent-hover")) return "Pick a darker text color, or turn your own text color off.";
  const brand = ["ring", "accent", "primary", "primary-hover", "on", "on-hover"];
  if (brand.includes(p.fg) || ["on", "on-hover"].includes(p.bg)) return scheme === "light" ? "Pick a darker brand color." : "Pick a lighter brand color.";
  return "Try the nearest color that passes, below.";
}

const swatch = (color: string) => {
  const s = el("span", "make-sw");
  s.style.setProperty("background", color);
  return s;
};

function check(b: Built) {
  const total = b.p.light.length + b.p.dark.length;
  const verdict = part("verdict");
  if (verdict) {
    verdict.textContent = b.failing
      ? `${total - b.failing} of ${total} pairs pass WCAG 2.2. ${b.failing} ${b.failing === 1 ? "does" : "do"} not:`
      : `All ${total} pairs pass WCAG 2.2 in both themes: text at 4.5:1, controls and focus rings at 3:1.`;
    verdict.dataset.tone = b.failing ? "crit" : "ok";
  }
  const fails = part("fails");
  if (fails) {
    fails.replaceChildren(
      ...SCHEMES.flatMap((scheme) =>
        b.p[scheme]
          .filter((p) => !p.pass)
          .map((p) => {
            const li = el("li");
            const what = el("p", "make-fail-what");
            what.append(swatch(b.t[scheme][p.fg] ?? ""), swatch(b.t[scheme][p.bg] ?? ""), el("b", undefined, `${p.what[0]?.toUpperCase()}${p.what.slice(1)}`), ` in ${scheme}: ${p.ratio.toFixed(2)}:1, needs ${p.min}:1`);
            li.append(what, el("p", "make-fail-fix", fixFor(p, scheme, b)));
            return li;
          }),
      ),
    );
  }
  part("nearest")?.toggleAttribute("hidden", !b.failing);
  const found = part("found");
  if (found) found.replaceChildren();
  const rows = part("pairs");
  if (rows) {
    rows.replaceChildren(
      ...SCHEMES.flatMap((scheme) =>
        b.p[scheme].map((p) => {
          const tr = el("tr");
          if (!p.pass) tr.dataset.fail = "";
          const colors = el("td");
          colors.append(swatch(b.t[scheme][p.fg] ?? ""), swatch(b.t[scheme][p.bg] ?? ""), el("code", undefined, `--${p.fg} on --${p.bg}`));
          const ratio = el("td", undefined, `${p.ratio.toFixed(2)}:1${p.pass ? "" : " (fails)"}`);
          ratio.dataset.num = "";
          const need = el("td", undefined, `${p.min}:1`);
          need.dataset.num = "";
          tr.append(el("td", undefined, scheme === "light" ? "Light" : "Dark"), el("td", undefined, p.what), colors, ratio, need);
          return tr;
        }),
      ),
    );
  }
}

// The nearest passing brand color: the same hue and chroma, lighter and darker by turns, a step of
// 0.01 in OKLCH lightness at a time; a few at a time, so the page stays responsive.
function nearest(s: Settings, done: (seed: string | null) => void) {
  const { L, C, H } = seedLch(s.seed);
  const tries: number[] = [];
  for (let k = 1; k <= 60; k++) for (const l of [L + k * 0.01, L - k * 0.01]) if (l > 0.05 && l < 0.98) tries.push(l);
  let i = 0;
  const step = () => {
    for (const end = i + 4; i < end && i < tries.length; i++) {
      const seed = oklch(tries[i] as number, C, H);
      if (failingFor(seed, s.anchor, "light") === 0 || failingFor(seed, s.anchor, "dark") === 0) return done(seed);
    }
    if (i < tries.length) setTimeout(step, 0);
    else done(null);
  };
  step();
}

// ---- the files -----------------------------------------------------------------------------

const where = () => (radio("mk-where") === "family" ? "family" : "root");
const familyName = () => (controls.name?.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "brand");
const stackList = (stack: string) => stack.split(",").map((f) => f.trim().replace(/^"|"$/g, ""));

function css(b: Built): string {
  const { s, label } = b;
  const total = b.p.light.length + b.p.dark.length;
  const scoped = where() === "family";
  const name = familyName();
  const colors = (scoped ? renderScoped(name, { seed: s.seed, anchor: s.anchor, label }) : renderFamily(s.seed, s.anchor, label))
    .replace(/^\/\*[\s\S]*?\*\/\n/, "")
    .replace(/^ {2}--(ui|mono): .*\n/gm, "");
  const look = shape(s);
  const faces = [...new Set([s.ui, s.display, s.mono])].map((f) => FACES[f]?.name).filter((n) => n && !n.startsWith("The device")).join(", ");
  const selector = scoped ? `[data-family="${name}"]` : ":root";
  const indent = (text: string) => text.replace(/^(?=.)/gm, "  ");
  return `/* A theme from Capsomer's theme builder: ${shareUrl(s)}
   Brand color ${s.seed}${s.anchor ? `, text color ${s.anchor}` : ""}, ${label} labels on buttons. ${total - b.failing} of ${total} contrast pairs pass WCAG 2.2.
   With Capsomer, load it after capsomer/tokens.css. ${scoped ? `Put data-family="${name}" on any element to switch its subtree.` : "It themes the whole page."}${faces ? `\n   Load the faces yourself: ${faces}.` : ""} */
@layer cap.tokens {
${indent(colors)}
  ${selector} {
${Object.entries(look).map(([k, v]) => `    --${k}: ${v};`).join("\n")}
    --text-size: var(--fs-body);
  }
}
`;
}

function json(b: Built): string {
  const color = (t: Tokens) => Object.fromEntries([...FAMILY_ORDER, ...CHART_ORDER].map((k) => [k, { $type: "color", $value: t[k] }]));
  const dim = (v: string) => ({ $type: "dimension", $value: { value: Number.parseFloat(v), unit: "px" } });
  const look = shape(b.s);
  const pick = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, dim(look[k] ?? "0px")]));
  return `${JSON.stringify(
    {
      $description: `A theme from Capsomer's theme builder: ${shareUrl(b.s)}. Brand color ${b.s.seed}. W3C design tokens format; the CSS file is the same theme.`,
      color: { light: color(b.t.light), dark: color(b.t.dark) },
      font: {
        ui: { $type: "fontFamily", $value: stackList(look.ui ?? "") },
        display: { $type: "fontFamily", $value: stackList(look.display ?? "") },
        mono: { $type: "fontFamily", $value: stackList(look.mono ?? "") },
      },
      type: pick(Object.keys(sizes(b.s.size, b.s.density))),
      radius: pick(Object.keys(corners(b.s.radius))),
      density: pick(["control", "pad-x", "pad-y", "pad-card", "gap", "row-h"]),
    },
    null,
    2,
  )}\n`;
}

let current: Built | null = null;
const fileTab = () => ($("#mk-t-json")?.getAttribute("aria-selected") === "true" ? "json" : "css");

function files(b: Built) {
  const c = part("css");
  if (c) c.textContent = css(b);
  const j = part("json");
  if (j) j.textContent = json(b);
}

// ---- wiring --------------------------------------------------------------------------------

const same = (a: Settings, b: Settings) => (Object.keys(a) as Array<keyof Settings>).every((k) => a[k] === b[k]);
const presetFor = (s: Settings) => PRESETS.flatMap((g) => g.items).find((p) => same(p.settings, s))?.id ?? "";

let queued = false;
function update() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    const s = read();
    last = s;
    controls.anchorBox?.toggleAttribute("hidden", !controls.anchorOn?.checked);
    if (controls.radiusOut) controls.radiusOut.textContent = `${s.radius}px`;
    controls.radius?.style.setProperty("--cap-range-fill", `${(s.radius / 16) * 100}%`);
    if (controls.preset) controls.preset.value = presetFor(s);
    const b = build(s);
    current = b;
    paint(b);
    check(b);
    files(b);
    try {
      history.replaceState(history.state, "", `#${toHash(s)}`);
    } catch {
      /* a sandboxed frame may refuse; the theme still changes */
    }
  });
}

const form = part<HTMLFormElement>("controls");
form?.addEventListener("submit", (e) => e.preventDefault());
// A preset's own text color goes with its brand color: a new brand color drops it, unless the
// text color is one you set yourself.
let anchorOwn = false;
form?.addEventListener("input", (e) => {
  const t = e.target as HTMLElement;
  if (t === controls.anchor || t === controls.anchorPick || t === controls.anchorOn) anchorOwn = true;
  if ((t === controls.seed || t === controls.seedPick) && !anchorOwn && controls.anchorOn?.checked) {
    controls.anchorOn.checked = false;
    controls.anchorBox?.setAttribute("hidden", "");
  }
  if (t === controls.seedPick && controls.seed) controls.seed.value = controls.seedPick.value;
  if (t === controls.seed && controls.seedPick && hex(controls.seed.value)) controls.seedPick.value = hex(controls.seed.value) as string;
  if (t === controls.anchorPick && controls.anchor) controls.anchor.value = controls.anchorPick.value;
  if (t === controls.anchor && controls.anchorPick && hex(controls.anchor.value)) controls.anchorPick.value = hex(controls.anchor.value) as string;
  if (t === controls.preset) {
    const p = PRESETS.flatMap((g) => g.items).find((x) => x.id === controls.preset?.value);
    if (p) {
      write(p.settings);
      anchorOwn = false;
    }
  }
  update();
});
form?.addEventListener("change", update);

// The export's own settings: where the theme applies, and the family's name.
for (const r of document.querySelectorAll<HTMLInputElement>("input[name='mk-where']")) {
  r.addEventListener("change", () => {
    part("name")?.toggleAttribute("hidden", where() !== "family");
    if (current) files(current);
  });
}
controls.name?.addEventListener("input", () => {
  const echo = part("name-echo");
  if (echo) echo.textContent = familyName();
  if (current) files(current);
});

part("find")?.addEventListener("click", () => {
  const found = part("found");
  const s = current?.s;
  if (!found || !s) return;
  found.textContent = "Looking…";
  nearest(s, (seed) => {
    found.replaceChildren();
    if (!seed) {
      found.textContent = s.anchor ? "No color of this hue passes with your own text color. Turn it off and try again." : "No color of this hue passes. Try another hue.";
      return;
    }
    const use = el("button", "cap-btn", `Use ${seed}`);
    use.setAttribute("type", "button");
    use.dataset.size = "sm";
    use.addEventListener("click", () => {
      write({ ...s, seed });
      update();
      controls.seed?.focus();
    });
    found.append(swatch(seed), ` ${seed} is the nearest that passes every pair. `, use);
  });
});

const said = part("said");
const say = (text: string) => {
  if (!said) return;
  said.textContent = text;
  setTimeout(() => {
    if (said.textContent === text) said.textContent = "";
  }, 2500);
};
const clip = async (text: string, done: string) => {
  try {
    await navigator.clipboard.writeText(text);
    say(done);
  } catch {
    say("Copy failed. Select the text and copy it yourself.");
  }
};
part("copy")?.addEventListener("click", () => current && clip(fileTab() === "json" ? json(current) : css(current), fileTab() === "json" ? "Tokens copied" : "CSS copied"));
part("share")?.addEventListener("click", () => current && clip(shareUrl(current.s), "Link copied"));
const download = part("download");
download?.addEventListener("click", () => {
  if (!current) return;
  const kind = fileTab();
  const blob = new Blob([kind === "json" ? json(current) : css(current)], { type: kind === "json" ? "application/json" : "text/css" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = kind === "json" ? "tokens.json" : "theme.css";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
// The download button names the file of the open tab.
const tabWatch = new MutationObserver(() => {
  if (download) download.textContent = fileTab() === "json" ? "Download tokens.json" : "Download theme.css";
});
const jsonTab = $("#mk-t-json");
if (jsonTab) tabWatch.observe(jsonTab, { attributes: true, attributeFilter: ["aria-selected"] });

// The previews' chips and switches respond, as the components do in an app.
for (const chip of document.querySelectorAll<HTMLButtonElement>(".make-pane .cap-chip")) {
  chip.addEventListener("click", () => chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true")));
}
for (const sw of document.querySelectorAll<HTMLInputElement>(".make-pane .cap-switch input")) {
  sw.addEventListener("change", () => {
    const state = sw.parentElement?.querySelector(".cap-switch-state");
    if (state) state.textContent = sw.checked ? "On" : "Off";
  });
}

const start = fromHash(location.hash);
if (start) {
  write(start);
  anchorOwn = Boolean(start.anchor);
}
update();
