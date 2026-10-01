// Loaded by every component's states.html. It brings in the fonts, the tokens, the base
// and every component's CSS, and sets the theme from ?theme=light|dark so the site can
// show a page in either theme and the tests can visit both.
import "@fontsource/schibsted-grotesk/400.css";
import "@fontsource/schibsted-grotesk/500.css";
import "@fontsource/schibsted-grotesk/600.css";
import "@fontsource/schibsted-grotesk/800.css";
import "@fontsource/martian-mono/400.css";
import "@fontsource-variable/source-serif-4/index.css";
import "../css/tokens.css";
import "../css/base.css";
import "../css/prose.css";
import "./specimen.css";

import.meta.glob("../components/*/*.css", { eager: true });

const params = new URLSearchParams(location.search);
const theme = params.get("theme");
if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;

// Page-level specimens (the shell, a status region) are written as
// <template data-specimen="id" data-title="Title" data-height="420">. A states page shows
// each one in a frame of its own, so every specimen is a whole document with one main
// landmark and its own ids; ?only=<id> renders that one template as the whole page, which
// is also what a spec visits.
const only = params.get("only");
if (only) {
  const tpl = document.querySelector<HTMLTemplateElement>(`template[data-specimen="${CSS.escape(only)}"]`);
  document.body.className = "cap-specimen-only";
  document.body.replaceChildren(tpl ? tpl.content.cloneNode(true) : Object.assign(document.createElement("p"), { textContent: `No specimen named ${only}.` }));
  document.title = `${tpl?.dataset.title ?? only}: ${document.title}`;
} else {
  for (const tpl of document.querySelectorAll<HTMLTemplateElement>("template[data-specimen]")) {
    const id = tpl.dataset.specimen ?? "";
    const section = document.createElement("section");
    section.className = "cap-specimen";
    section.setAttribute("aria-labelledby", `specimen-${id}`);
    const h = document.createElement("h2");
    h.id = `specimen-${id}`;
    h.textContent = tpl.dataset.title ?? id;
    const frame = document.createElement("iframe");
    const q = new URLSearchParams({ only: id });
    if (theme) q.set("theme", theme);
    frame.src = `?${q}`;
    frame.title = `${tpl.dataset.title ?? id} specimen`;
    frame.className = "cap-specimen-frame";
    frame.dataset.width = tpl.dataset.width ?? "";
    // Sizes through the CSSOM, never a style attribute (CSP style-src 'self').
    frame.style.setProperty("--frame-h", `${Number(tpl.dataset.height ?? 360)}px`);
    if (tpl.dataset.width) frame.style.setProperty("--frame-w", `${Number(tpl.dataset.width)}px`);
    section.append(h, frame);
    tpl.replaceWith(section);
  }
}
