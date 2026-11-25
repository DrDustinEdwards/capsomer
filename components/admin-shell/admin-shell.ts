// The admin shell's behavior: collapse the menu (remembered), attach each control's name tip, and
// jump between apps with G and 1 to 9. The header's behavior is the site header's, attached by enhance().
import { readStored, reducedMotion, writeStored } from "../hooks/hooks.ts";
import { DEFAULT_PREF } from "../shell/shell.ts";
import { isTyping, singleKeysOff } from "../shortcuts/shortcuts.ts";
import { enhance as enhanceHeader } from "../site-header/site-header.ts";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.ts";

// A count is a glance: past 99 it says 99+ (the site header's rule); the accessible name keeps the real count.
export { badgeText } from "../site-header/site-header.ts";

export const ADMIN_PREF = DEFAULT_PREF;

// Page transitions (View Transitions API), opt-in with `data-transition="page"`: the content cross-fades
// while the strip and menu stay put. Runs `update` straight away, with no animation, when the browser
// lacks startViewTransition, reduced motion is asked for, or the shell has not opted in.
type Transitioner = {
  startViewTransition?: (update: () => void | Promise<void>) => { finished: Promise<void> };
};

export function pageTransitionsOn(
  shell: HTMLElement | null = document.querySelector("[data-cap='admin-shell']"),
): boolean {
  if (!shell || shell.dataset.transition !== "page") return false;
  if (typeof (document as unknown as Transitioner).startViewTransition !== "function") return false;
  return !reducedMotion();
}

export async function startPageTransition(
  update: () => void | Promise<void>,
  shell?: HTMLElement | null,
): Promise<void> {
  if (!pageTransitionsOn(shell)) {
    await update();
    return;
  }
  try {
    await (document as unknown as Required<Transitioner>).startViewTransition(update).finished;
  } catch {
    // A skipped or interrupted transition still showed the page; its animation is all that was lost.
  }
}

export function setMenu(shell: HTMLElement, collapsed: boolean, remember = true): void {
  if (collapsed) shell.dataset.menu = "collapsed";
  else delete shell.dataset.menu;
  const toggle = shell.querySelector<HTMLButtonElement>("[data-cap-part='menu-toggle']");
  if (toggle) {
    const name = collapsed ? "Expand menu" : "Collapse menu";
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", name);
    for (const text of toggle.querySelectorAll(
      ":scope > .cap-admin-label, .cap-admin-tip .cap-admin-tip-text",
    ))
      text.textContent = name;
  }
  if (remember)
    writeStored(shell.dataset.capPref ?? ADMIN_PREF, collapsed ? "collapsed" : "expanded");
}

export function toggleMenu(shell: HTMLElement): void {
  setMenu(shell, shell.dataset.menu !== "collapsed");
}

// G then a number jumps to that app (Ctrl and a digit belong to the browser's tabs). Returns the app's
// address, or null when the key is not part of a jump or single-key shortcuts are off.
export const JUMP_WINDOW_MS = 1200;
export function jumpTarget(
  armed: { at: number },
  e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "target">,
  apps: ReadonlyArray<{ href: string; current?: boolean }>,
  now = Date.now(),
): string | null {
  if (e.ctrlKey || e.metaKey || e.altKey || singleKeysOff()) return null;
  if (isTyping(e.target)) return null;
  const live = armed.at > 0 && now - armed.at < JUMP_WINDOW_MS;
  armed.at = e.key === "g" ? now : 0;
  if (!live || !/^[1-9]$/.test(e.key)) return null;
  const app = apps[Number(e.key) - 1];
  return app && !app.current ? app.href : null;
}

// The menu's collapse key (`[` by default); never with a modifier, while typing, during IME composition,
// after another handler took it, or while single-key shortcuts are off.
export function isCollapseKey(
  e: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "altKey" | "target" | "defaultPrevented" | "isComposing"
  >,
  key = "[",
): boolean {
  if (!key || e.key !== key || e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.defaultPrevented || e.isComposing || singleKeysOff()) return false;
  return !isTyping(e.target);
}

// The entry for the current address: its `href` or a `match` is the path or a folder above it, the
// longest winning. "/" matches only itself.
export interface MatchEntry {
  id: string;
  href: string;
  match?: ReadonlyArray<string | RegExp>;
}
export function currentEntryId(
  pathname: string,
  entries: ReadonlyArray<MatchEntry>,
): string | undefined {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  let best: { id: string; len: number } | undefined;
  for (const e of entries) {
    const rules = e.match ?? [new URL(e.href, "https://x.invalid").pathname];
    for (const rule of rules) {
      let len = -1;
      if (typeof rule === "string") {
        const base = rule.length > 1 ? rule.replace(/\/+$/, "") : rule;
        if (path === base) len = base.length + 1;
        else if (base !== "/" && path.startsWith(`${base}/`)) len = base.length;
      } else {
        const m = rule.exec(path);
        if (m) len = m[0].length;
      }
      if (len >= 0 && (!best || len > best.len)) best = { id: e.id, len };
    }
  }
  return best?.id;
}

// Cloudflare Access's sign-out address: a fetch cannot follow it into a navigation, so the browser goes there.
export const ACCESS_LOGOUT = "/cdn-cgi/access/logout";

export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const shell of root.querySelectorAll<HTMLElement>(
    "[data-cap='admin-shell']:not([data-cap-ready])",
  )) {
    shell.dataset.capReady = "";
    const pref = readStored(shell.dataset.capPref ?? ADMIN_PREF);
    if (pref) setMenu(shell, pref === "collapsed", false);

    // Each control's name tip; a menu link's tip adds no description and shows only while the menu is collapsed.
    const detachTips = [...shell.querySelectorAll<HTMLElement>(".cap-admin-tip")].map((tip) => {
      const trigger = tip.parentElement;
      if (!trigger) return () => undefined;
      const detach = attachTip(trigger, tip);
      if (trigger.closest(".cap-admin-menu")) trigger.removeAttribute("aria-describedby");
      const used = () => hideTip(trigger);
      trigger.addEventListener("click", used);
      return () => {
        trigger.removeEventListener("click", used);
        detach();
      };
    });
    const detachHeader = enhanceHeader(shell);

    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest("[data-cap-part='menu-toggle']")) toggleMenu(shell);
    };
    const armed = { at: 0 };
    const onKey = (e: KeyboardEvent) => {
      if (isCollapseKey(e, shell.dataset.capCollapseKey ?? "[")) {
        const toggle = shell.querySelector<HTMLElement>("[data-cap-part='menu-toggle']");
        if (toggle && toggle.getClientRects().length > 0) {
          e.preventDefault();
          toggleMenu(shell);
        }
        return;
      }
      const apps = [...shell.querySelectorAll<HTMLAnchorElement>(".cap-admin-tile")].map((a) => ({
        href: a.href,
        current: a.getAttribute("aria-current") === "true",
      }));
      const to = jumpTarget(armed, e, apps);
      if (to) {
        e.preventDefault();
        location.assign(to);
      }
    };
    shell.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    undo.push(() => {
      shell.removeEventListener("click", onClick);
      detachTips.forEach((f) => f());
      document.removeEventListener("keydown", onKey);
      detachHeader();
      delete shell.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
