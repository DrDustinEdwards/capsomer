// The public pages' script (site/home.ts writes them; they read whole without it). The header and its
// theme button are Capsomer's own site header; the rest is the front page's: the site picker, the
// type sample, the component filter, the copy button and the live test count.
import { enhance as enhanceHeader } from "../components/site-header/site-header.ts";
import { enhance as enhanceTheme } from "../components/theme-switch/theme-switch.ts";
// The family sites' faces, for the site picker: a browser fetches a face only once a site that uses it is worn.
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-800.css";
import "@fontsource/dm-mono/latin-400.css";
import "@fontsource/fraunces/latin-400.css";
import "@fontsource/fraunces/latin-800.css";
import "@fontsource/open-sans/latin-400.css";
import "@fontsource/open-sans/latin-600.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-800.css";

enhanceHeader();
enhanceTheme();

// The page wears a family site: its layer (data-cap-site) and its family (data-family; purple is the
// default, so none) go on <html>, as the sites themselves set them, crossfading where the browser
// has view transitions and motion is allowed. Without a script the picker stays hidden.
const wear = document.querySelector<HTMLFieldSetElement>("[data-cap-part='wear']");
const still = matchMedia("(prefers-reduced-motion: reduce)");
if (wear) {
  wear.hidden = false;
  const root = document.documentElement;
  const now = wear.querySelector(".home-wear-now");
  for (const input of wear.querySelectorAll<HTMLInputElement>("input[name='home-wear']")) {
    input.addEventListener("change", () => {
      const apply = () => {
        if (input.value) root.dataset.capSite = input.value;
        else delete root.dataset.capSite;
        const family = input.dataset.family;
        if (family && family !== "purple") root.dataset.family = family;
        else delete root.dataset.family;
        if (now) now.textContent = input.closest("label")?.dataset.note ?? "";
      };
      if (document.startViewTransition && !still.matches) document.startViewTransition(apply);
      else apply();
    });
  }
}
// The stage's chips and switch respond, so the panel behaves like the components it shows.
for (const chip of document.querySelectorAll<HTMLButtonElement>(".home-try-stage .cap-chip")) {
  chip.addEventListener("click", () => chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true")));
}
for (const sw of document.querySelectorAll<HTMLInputElement>(".home-try-stage .cap-switch input")) {
  sw.addEventListener("change", () => {
    const state = sw.parentElement?.querySelector(".cap-switch-state");
    if (state) state.textContent = sw.checked ? "On" : "Off";
  });
}

// Your own words in every size of the type scale.
const sample = document.querySelector<HTMLElement>("[data-cap-part='sample']");
if (sample) {
  sample.hidden = false;
  const input = sample.querySelector("input");
  const specimens = document.querySelectorAll<HTMLElement>(".home-scale-sample");
  input?.addEventListener("input", () => {
    for (const el of specimens) el.textContent = input.value.trim() || "Phage λ";
  });
}

// The component filter: by name and summary, with the count said aloud.
const find = document.querySelector<HTMLElement>("[data-cap-part='find']");
const parts = [...document.querySelectorAll<HTMLLIElement>(".home-parts > li")];
if (find) {
  find.hidden = false;
  const input = find.querySelector("input");
  const count = find.querySelector("[role='status']");
  input?.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const li of parts) {
      const hit = !q || (li.textContent ?? "").toLowerCase().includes(q);
      li.hidden = !hit;
      if (hit) shown++;
    }
    if (count) count.textContent = q ? `${shown} of ${parts.length} components` : `${parts.length} components`;
  });
}

// Copy the install lines; the button says it worked.
const copy = document.querySelector<HTMLButtonElement>("[data-cap-part='copy']");
if (copy && navigator.clipboard) {
  copy.hidden = false;
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById("home-install")?.textContent ?? "");
      copy.textContent = "Copied";
    } catch {
      copy.textContent = "Copy failed";
    }
    setTimeout(() => (copy.textContent = "Copy"), 2000);
  });
}

// The last run on main, from the results branch CI writes (the admin reads the same file).
const live = document.querySelector<HTMLElement>("[data-live='tests']");
if (live) {
  fetch("https://raw.githubusercontent.com/DrDustinEdwards/capsomer/results/results.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { totals?: { passed: number; failed: number } } | null) => {
      if (!j?.totals) return;
      const { passed, failed } = j.totals;
      const [n, , note] = live.children;
      if (n) n.textContent = (passed + failed).toLocaleString("en-US");
      if (note) note.textContent = failed ? `${failed} failing on the last run` : "all passed on the last run";
      live.hidden = false;
    })
    .catch(() => {});
}
