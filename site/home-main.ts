// The public page's script (site/home.ts writes the page; it reads whole without this). The header and
// its theme button are Capsomer's own site header; the rest is the page's: the family preview, the
// component filter, the copy button and the live test count.
import { enhance as enhanceHeader } from "../components/site-header/site-header.ts";
import { enhance as enhanceTheme } from "../components/theme-switch/theme-switch.ts";

enhanceHeader();
enhanceTheme();

// The preview takes the chosen family as a site would, with data-family (purple is the default, so none).
const stage = document.querySelector<HTMLElement>("[data-cap-part='stage']");
for (const input of document.querySelectorAll<HTMLInputElement>("input[name='home-family']")) {
  input.addEventListener("change", () => {
    if (!stage) return;
    if (input.value === "purple") delete stage.dataset.family;
    else stage.dataset.family = input.value;
  });
}
// The preview's chips and switch respond, so the panel behaves like the components it shows.
for (const chip of document.querySelectorAll<HTMLButtonElement>(".home-try .cap-chip")) {
  chip.addEventListener("click", () => chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true")));
}
for (const sw of document.querySelectorAll<HTMLInputElement>(".home-try .cap-switch input")) {
  sw.addEventListener("change", () => {
    const state = sw.parentElement?.querySelector(".cap-switch-state");
    if (state) state.textContent = sw.checked ? "On" : "Off";
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
