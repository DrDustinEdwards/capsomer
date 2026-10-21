// The publish gate: one region beside the publish button that says whether this can go out, and if
// not, exactly why. Failing checks come first, required apart from advisory, each row naming its
// cause and linking to it; the passing ones fold into a disclosure; one row per destination site
// carries its own state and its own button. Pure helpers first (they decide the states and the
// words), then the page: the DOM is the one source of truth, every row is rendered from its data
// attributes, so what the server delivered and what this module redraws are the same markup. No
// framework; the React wrapper reuses the pure functions.
// The transitions and their intents are publish-transition.ts, the gate's DOM-free half.

import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { statusEl } from "../flag-list/flag-list.ts";
import { fail, say } from "../message/message.ts";
import { attachRowList } from "../row-list/row-list.ts";
import { enhance as enhanceTime } from "../time/time.ts";
import { type CheckState, type GateCheck, type GateHold, type GatePublished, type GateSite, type GateState, WORD, advisoryHeading, appliesTo, checkState, countChecks, describeGate, holdText, passedHeading, requiredHeading, siteDetail, siteState } from "./publish-gate-model.ts";
import { FIRST_PUBLICATION_NOTE, PUBLISH_CONFIRMED_INTENT } from "./publish-transition.ts";

export { checkState, sortChecks, gateState, appliesTo, siteState, worstState, countChecks, requiredHeading, advisoryHeading, passedHeading, holdText, nameList, stateWord, describeGate, siteDetail } from "./publish-gate-model.ts";
export type { GateState, CheckState, GateCheck, GateHold, GatePublished, GateSite, GateCounts, GateReading } from "./publish-gate-model.ts";

export { FIRST_PUBLICATION_NOTE };

// ---------------------------------------------------------------------------------------
// The page.

const READY = "data-cap-ready";
const part = <T extends HTMLElement = HTMLElement>(el: ParentNode, name: string) => el.querySelector<T>(`[data-cap-part='${name}']`);

function h<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

const TONE: Record<GateState, "crit" | "info" | "ok"> = { blocked: "crit", held: "info", ready: "ok", published: "ok" };
const GLYPH: Record<GateState, string> = { blocked: "crit", held: "info", ready: "ok", published: "ok" };

export function stateStatus(s: GateState): HTMLSpanElement {
  return statusEl(TONE[s], WORD[s], GLYPH[s]);
}

// A check, read from its row.
export function readCheck(li: HTMLElement): GateCheck {
  const c: GateCheck = {
    id: li.dataset.check ?? li.id,
    name: li.dataset.name ?? "",
    required: li.hasAttribute("data-required"),
    ok: li.dataset.ok === "true",
    cause: li.dataset.cause ?? "",
  };
  if (li.dataset.pass) c.pass = li.dataset.pass;
  if (li.dataset.href) c.href = li.dataset.href;
  if (li.dataset.fix) c.fix = li.dataset.fix;
  if (li.dataset.site) c.site = li.dataset.site;
  return c;
}

export function readSite(li: HTMLElement): GateSite {
  const s: GateSite = { id: li.dataset.site ?? li.id, name: li.dataset.name ?? "" };
  if (li.dataset.holdText) s.hold = { text: li.dataset.holdText, note: li.dataset.holdNote };
  if (li.dataset.publishedAt && li.dataset.publishedUrl) s.published = { at: li.dataset.publishedAt, url: li.dataset.publishedUrl };
  if (li.hasAttribute("data-first")) s.first = true;
  return s;
}

export interface GateHooks {
  // Publish to these destinations. Resolve when it is live; reject with an Error whose message says why not.
  publish?: (siteIds: string[]) => Promise<void>;
  // Take it off the public site. Reversible, so it is done at once and offers Undo.
  unpublish?: (siteIds: string[]) => Promise<void>;
}

export interface GateHandle {
  refresh(): void;
  // Sets one check's result: the row, the groups, the counts, the destinations and the summary follow.
  setCheck(id: string, patch: { ok: boolean; cause?: string }): void;
  setHold(siteId: string, hold: GateHold | null): void;
  setPublished(siteId: string, published: GatePublished | null): void;
  detach(): void;
}

const hooksFor = new WeakMap<HTMLElement, GateHooks>();

export function attachPublishGate(region: HTMLElement, hooks: GateHooks = {}): GateHandle {
  hooksFor.set(region, hooks);
  const summary = part(region, "summary");
  const summaryId = summary?.id ?? "";
  const list = region.querySelector<HTMLElement>(".cap-gate-all");
  const detachRows = list ? attachRowList(list) : () => {};
  const busy = new Set<string>();
  let previous = "";

  const sectionRows = (name: string) => region.querySelector<HTMLElement>(`.cap-gate-section[data-section='${name}'] .cap-gate-section-rows`);
  const checkRows = () => Array.from(region.querySelectorAll<HTMLElement>("li.cap-check"));
  const siteRows = () => Array.from(region.querySelectorAll<HTMLElement>("li.cap-gate-site"));

  // The containers that hold a destination's buttons: inside its row, or anywhere on the page
  // that names this gate and site (the editor bar's own publish button).
  const containers = (siteId: string) => {
    const all = Array.from(document.querySelectorAll<HTMLElement>("[data-cap-actions]")).filter((c) => c.dataset.site === siteId && (c.dataset.gate === region.id || region.contains(c)));
    return all;
  };

  // A check's row, from its data: status, title and link, detail, the site it concerns.
  const renderCheck = (li: HTMLElement) => {
    const c = readCheck(li);
    const st = checkState(c);
    const status = li.querySelector<HTMLElement>(".cap-row-status");
    if (status) status.replaceChildren(st === "failing" ? statusEl("crit", "Failing") : st === "advisory" ? statusEl("warn", "Advisory") : statusEl("ok", "Passed"));
    if (st === "failing") li.dataset.tone = "crit";
    else delete li.dataset.tone;
    const words = c.ok ? (c.pass ?? `${c.name}: passing`) : c.cause;
    const title = li.querySelector<HTMLElement>(".cap-row-title");
    if (title) {
      if (c.href) {
        const a = h("a", undefined, words);
        a.href = c.href;
        a.setAttribute("aria-describedby", `${li.id}-s ${li.id}-d`);
        title.replaceChildren(a);
      } else title.replaceChildren(Object.assign(h("span", "cap-gate-title-text"), { textContent: words }));
    }
    const detail = li.querySelector<HTMLElement>(".cap-row-detail");
    if (detail) {
      detail.replaceChildren(h("span", "cap-check-name", c.name));
      if (!c.ok && c.fix) detail.append(". ", h("span", "cap-check-fix", `Fix: ${c.fix}`));
    }
    const meta = li.querySelector<HTMLElement>(".cap-row-meta");
    if (meta) {
      const siteName = c.site ? siteRows().find((r) => r.dataset.site === c.site)?.dataset.name : undefined;
      meta.replaceChildren(...(siteName ? [document.createTextNode(`on ${siteName}`)] : []));
    }
  };

  // One destination's buttons, in each container that holds them.
  const renderActions = (site: GateSite, state: GateState) => {
    for (const box of containers(site.id)) {
      const name = box.dataset.siteLabel;
      const suffix = name ? `, ${name}` : "";
      // Buttons in a row are small; the page's own publish control sets data-btn-size="default".
      const size = box.dataset.btnSize === "default" ? "" : (box.dataset.btnSize ?? "sm");
      if (state === "published") {
        const view = box.querySelector<HTMLAnchorElement>("a[data-cap-part='view']");
        const un = box.querySelector<HTMLButtonElement>("button[data-cap-part='unpublish']");
        if (!view || !un || box.querySelector("[data-cap-part='publish']")) {
          const a = h("a", "cap-btn");
          a.dataset.capPart = "view";
          if (size) a.dataset.size = size;
          a.href = site.published?.url ?? "#";
          a.textContent = "View";
          // With several destinations the name says which one; the visible word starts it.
          if (suffix) a.setAttribute("aria-label", `View live page${suffix}`);
          const b = h("button", "cap-btn");
          b.type = "button";
          b.dataset.capPart = "unpublish";
          if (size) b.dataset.size = size;
          b.dataset.variant = "quiet";
          b.dataset.site = site.id;
          b.textContent = "Unpublish";
          if (suffix) b.setAttribute("aria-label", `Unpublish${suffix}`);
          box.replaceChildren(a, b);
        } else if (site.published) view.href = site.published.url;
        continue;
      }
      let b = box.querySelector<HTMLButtonElement>("button[data-cap-part='publish']");
      if (!b) {
        b = h("button", "cap-btn");
        b.type = "submit";
        b.name = "intent";
        b.value = "publish";
        b.dataset.capPart = "publish";
        if (size) b.dataset.size = size;
        b.dataset.site = site.id;
        box.replaceChildren(b);
      }
      const isBusy = busy.has(site.id);
      const label = isBusy ? "Publishing..." : state === "blocked" ? "Publish blocked" : state === "held" ? "Publish held" : "Publish";
      b.dataset.variant = state === "ready" || isBusy ? "primary" : "secondary";
      if (state === "ready" && !isBusy) b.removeAttribute("aria-disabled");
      else b.setAttribute("aria-disabled", "true");
      if (isBusy) b.setAttribute("aria-busy", "true");
      else b.removeAttribute("aria-busy");
      // A blocked or held button stays focusable and says why: the region's summary describes it.
      if (state === "ready" && !isBusy) b.removeAttribute("aria-describedby");
      else if (summaryId) b.setAttribute("aria-describedby", summaryId);
      if (b.textContent !== label) b.textContent = label;
      if (suffix) b.setAttribute("aria-label", `${label}${suffix}`);
      else b.removeAttribute("aria-label");
    }
  };

  const refresh = () => {
    const checks = checkRows();
    const sites = siteRows();
    // Rows into the group their state says.
    const order = new Map(checks.map((li, i) => [li, Number(li.dataset.order ?? i)]));
    for (const li of checks) {
      if (!li.dataset.order) li.dataset.order = String(order.get(li));
      renderCheck(li);
    }
    const targets: Record<CheckState, HTMLElement | null> = { failing: sectionRows("required"), advisory: sectionRows("advisory"), passed: sectionRows("passed") };
    const bucket: Record<CheckState, HTMLElement[]> = { failing: [], advisory: [], passed: [] };
    for (const li of checks) bucket[checkState(readCheck(li))].push(li);
    for (const k of ["failing", "advisory", "passed"] as const) {
      const ul = targets[k];
      if (!ul) continue;
      const rows = bucket[k].sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
      rows.forEach((li, i) => {
        if (ul.children[i] !== li) ul.insertBefore(li, ul.children[i] ?? null);
      });
    }
    const data = checks.map(readCheck);
    const counts = countChecks(data);
    const setSection = (name: string, heading: string, shown: boolean) => {
      const sec = region.querySelector<HTMLElement>(`.cap-gate-section[data-section='${name}']`);
      if (!sec) return;
      sec.hidden = !shown;
      const t = sec.querySelector<HTMLElement>(".cap-gate-group-title");
      if (t && t.textContent !== heading) t.textContent = heading;
    };
    setSection("required", requiredHeading(counts.requiredFailing), counts.requiredFailing > 0);
    setSection("advisory", advisoryHeading(counts.advisoryFailing), counts.advisoryFailing > 0);
    const passedSec = region.querySelector<HTMLElement>(".cap-gate-section[data-section='passed']");
    if (passedSec) {
      passedSec.hidden = counts.passed === 0;
      const sum = passedSec.querySelector("summary");
      if (sum && sum.textContent !== passedHeading(counts.passed)) sum.textContent = passedHeading(counts.passed);
    }
    const clear = part(region, "clear");
    if (clear) clear.hidden = counts.requiredFailing + counts.advisoryFailing > 0;

    // Destinations.
    const model = sites.map(readSite);
    for (const [i, li] of sites.entries()) {
      const site = model[i] as GateSite;
      const mine = data.filter((c) => appliesTo(c, site.id));
      const state = siteState(site, data);
      li.dataset.state = state;
      if (state === "blocked") li.dataset.tone = "crit";
      else delete li.dataset.tone;
      li.querySelector(".cap-row-status")?.replaceChildren(stateStatus(state));
      const detail = li.querySelector<HTMLElement>(".cap-row-detail");
      if (detail) {
        const failing = mine.filter((c) => c.required && !c.ok);
        const adv = mine.filter((c) => !c.required && !c.ok).length;
        detail.textContent = siteDetail(state, failing, adv, site);
      }
      const meta = li.querySelector<HTMLElement>(".cap-row-meta");
      if (meta) {
        meta.replaceChildren();
        if (state === "published" && site.published) {
          const t = h("time", "cap-time");
          t.dataset.cap = "time";
          t.dataset.format = "exact";
          t.dateTime = site.published.at;
          t.textContent = site.published.at;
          meta.append(t);
          enhanceTime(meta);
        }
      }
      renderActions(site, state);
    }

    // The region.
    const reading = describeGate(model, data);
    region.dataset.state = reading.state;
    if (summary) {
      // Only a changed sentence is written, so a polite region does not repeat itself.
      const words = `${WORD[reading.state]}${reading.rest}`;
      if (summary.textContent !== words) summary.replaceChildren(stateStatus(reading.state), reading.rest);
    }
    if (previous && previous !== reading.state) region.dispatchEvent(new CustomEvent("cap:gate-state", { bubbles: true, detail: { state: reading.state, sites: Object.fromEntries(sites.map((li) => [li.dataset.site, li.dataset.state])) } }));
    previous = reading.state;
  };

  // The page's message region says results, with Undo; the summary is itself polite and live.
  const announce = (text: string, undo?: () => Promise<void>, undone?: string) => {
    if (!document.querySelector("[data-cap='message']")) return;
    say(text, undo ? { undo, undone } : {});
  };
  const problem = (text: string) => {
    if (document.querySelector("[data-cap='message']")) fail(text);
  };

  const setBusy = (id: string, on: boolean) => {
    if (on) busy.add(id);
    else busy.delete(id);
    refresh();
  };

  const siteRow = (id: string) => siteRows().find((r) => r.dataset.site === id);
  const setPublished = (id: string, p: GatePublished | null) => {
    const li = siteRow(id);
    if (!li) return;
    if (p) {
      li.dataset.publishedAt = p.at;
      li.dataset.publishedUrl = p.url;
      delete li.dataset.first;
    } else {
      delete li.dataset.publishedAt;
      delete li.dataset.publishedUrl;
    }
    refresh();
  };
  const setHold = (id: string, hold: GateHold | null) => {
    const li = siteRow(id);
    if (!li) return;
    if (hold) {
      li.dataset.holdText = holdText(hold);
      if (hold.note) li.dataset.holdNote = hold.note;
      else delete li.dataset.holdNote;
    } else {
      delete li.dataset.holdText;
      delete li.dataset.holdNote;
    }
    refresh();
  };
  const setCheck = (id: string, patch: { ok: boolean; cause?: string }) => {
    const li = checkRows().find((r) => r.dataset.check === id);
    if (!li) return;
    li.dataset.ok = String(patch.ok);
    if (patch.cause !== undefined) li.dataset.cause = patch.cause;
    refresh();
  };

  const run = async (site: GateSite, button: HTMLElement | null): Promise<void> => {
    const hk = hooksFor.get(region) ?? {};
    const form = (button as HTMLButtonElement | null)?.form;
    if (!hk.publish && form && button instanceof HTMLButtonElement) {
      // No script hook: the form posts as it would without JavaScript, with the confirmed intent.
      button.value = site.first ? PUBLISH_CONFIRMED_INTENT : "publish";
      form.requestSubmit(button);
      return;
    }
    setBusy(site.id, true);
    try {
      await hk.publish?.([site.id]);
    } catch (err) {
      setBusy(site.id, false);
      problem(`Could not publish to ${site.name}: ${err instanceof Error ? err.message : String(err)}`);
      (button?.isConnected ? button : containers(site.id)[0]?.querySelector<HTMLElement>("button"))?.focus();
      return;
    }
    busy.delete(site.id);
    setPublished(site.id, { at: new Date().toISOString(), url: siteRow(site.id)?.dataset.liveUrl ?? "#" });
    announce(`Published to ${site.name}.`);
    containers(site.id)[0]?.querySelector<HTMLElement>("a, button")?.focus();
  };

  const publish = async (id: string, button: HTMLElement | null) => {
    const li = siteRow(id);
    if (!li || busy.has(id)) return;
    const site = readSite(li);
    if (site.first) {
      // One-way for a first publication: previewed, with the destination listed, focus on Cancel.
      await confirm({
        title: `Publish to ${site.name}?`,
        lead: "Publishing for the first time cannot be taken back quietly: it goes public at once.",
        body: [`${site.name}: ${FIRST_PUBLICATION_NOTE}`],
        action: `Publish to ${site.name}`,
        returnTo: button,
        perform: async () => {
          await run(site, button);
        },
      });
      return;
    }
    await run(site, button);
  };

  const unpublish = async (id: string, button: HTMLElement | null) => {
    const li = siteRow(id);
    if (!li) return;
    const site = readSite(li);
    const hk = hooksFor.get(region) ?? {};
    const was = site.published;
    try {
      await hk.unpublish?.([id]);
    } catch (err) {
      return problem(`Could not unpublish from ${site.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
    void button;
    setPublished(id, null);
    containers(id)[0]?.querySelector<HTMLElement>("button")?.focus();
    announce(
      `Unpublished from ${site.name}.`,
      async () => {
        await hk.publish?.([id]);
        if (was) setPublished(id, was);
      },
      `Published to ${site.name} again.`,
    );
  };

  const onClick = (e: MouseEvent) => {
    const btn = (e.target as Element).closest<HTMLElement>("[data-cap-part='publish'], [data-cap-part='unpublish']");
    if (!btn) return;
    const box = btn.closest<HTMLElement>("[data-cap-actions]");
    if (!box || !(box.dataset.gate === region.id || region.contains(box))) return;
    const id = box.dataset.site ?? "";
    if (btn.dataset.capPart === "unpublish") return void unpublish(id, btn);
    // A blocked or held button is focusable so its reason can be heard; pressing it does nothing.
    if (btn.getAttribute("aria-disabled") === "true") return void e.preventDefault();
    const li = siteRow(id);
    const hk = hooksFor.get(region) ?? {};
    // With no hook and a form, a republication posts natively; a first one is previewed first.
    if (!hk.publish && btn instanceof HTMLButtonElement && btn.form && li && !li.hasAttribute("data-first")) return;
    e.preventDefault();
    void publish(id, btn);
  };
  document.addEventListener("click", onClick);

  // Any change to a check, a hold or a publication redraws; an app only flips the data.
  const mo = new MutationObserver(() => refresh());
  mo.observe(region, { subtree: true, attributes: true, attributeFilter: ["data-ok", "data-cause", "data-hold-text", "data-hold-note", "data-published-at", "data-published-url"] });

  refresh();
  return {
    refresh,
    setCheck,
    setHold,
    setPublished,
    detach() {
      document.removeEventListener("click", onClick);
      mo.disconnect();
      detachRows();
      hooksFor.delete(region);
      region.removeAttribute(READY);
    },
  };
}

// Attaches to every [data-cap="publish-gate"] under root not attached yet. Hooks say what publish
// and unpublish do; without them a publish button inside a form posts the form, and a first
// publication is previewed first. Returns a function that detaches them all.
export function enhance(root: ParentNode = document, hooks?: GateHooks): () => void {
  const handles: GateHandle[] = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='publish-gate']:not([data-cap-ready])")) {
    el.setAttribute(READY, "");
    handles.push(attachPublishGate(el, hooks));
  }
  return () => handles.forEach((hd) => hd.detach());
}
