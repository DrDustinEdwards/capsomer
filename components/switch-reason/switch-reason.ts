// The automation switch's behaviour. Clicking the switch, or Space on it, does not move it:
// it opens a one-line form asking why. Enter applies (a reason is required), Esc cancels
// and returns focus to the switch. On apply it dispatches `cap:switch-applied` with
// { checked, reason, waitUntil }, and the switch moves: at once, or, when a listener calls
// waitUntil(promise), once that promise resolves. The app writes its audit row there and
// offers Undo through the message region.

import { clearError, showError } from "../field/field.ts";
import { setSwitch } from "../switch/switch.ts";

export { setSwitch };

export const EVENT = "cap:switch-applied";
export const MISSING = "Write a reason in a few words. It goes in the audit log.";

export interface SwitchAppliedDetail {
  // The state the switch is moving to.
  checked: boolean;
  reason: string;
  // Hold the switch until the app has saved the change. A rejection keeps the form open
  // with the error beside the reason.
  waitUntil(promise: Promise<unknown>): void;
}

export function question(name: string, checked: boolean): string {
  return `Why turn ${name} ${checked ? "on" : "off"}?`;
}

export function failedMessage(name: string, checked: boolean, err: unknown): string {
  const why = err instanceof Error && err.message ? ` ${err.message}` : "";
  return `Could not turn ${name} ${checked ? "on" : "off"}.${why} Try again, or press Esc to cancel.`;
}

interface Parts {
  sw: HTMLInputElement;
  label: HTMLElement;
  form: HTMLFormElement;
  reason: HTMLInputElement;
  ask: HTMLElement;
  apply: HTMLButtonElement | null;
  cancel: HTMLElement | null;
}

function partsOf(root: HTMLElement): Parts | null {
  const sw = root.querySelector<HTMLInputElement>("input[role='switch']");
  const label = sw?.closest<HTMLElement>(".cap-switch");
  const form = root.querySelector<HTMLFormElement>("form.cap-switch-reason-form");
  const reason = form?.querySelector<HTMLInputElement>("input.cap-input");
  const ask = form?.querySelector<HTMLElement>(".cap-field-label");
  if (!sw || !label || !form || !reason || !ask) return null;
  return {
    sw,
    label,
    form,
    reason,
    ask,
    apply: form.querySelector<HTMLButtonElement>("button[type='submit']"),
    cancel: form.querySelector<HTMLElement>("[data-cap-part='cancel']"),
  };
}

// Attaches to every [data-cap="switch-reason"] under root that is not attached yet.
// data-name on the root is the thing switched, as it reads in the question ("the improve
// loop"); without it, the switch's label is used. Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='switch-reason']:not([data-cap-ready])")) {
    const p = partsOf(el);
    if (!p) continue;
    el.dataset.capReady = "";
    const { sw, label, form, reason, ask, apply, cancel } = p;
    const name = el.dataset.name ?? label.textContent?.replace(/\s+(On|Off)\s*$/, "").trim() ?? "this";
    form.noValidate = true;
    let busy = false;

    const setBusy = (on: boolean) => {
      busy = on;
      reason.readOnly = on;
      if (apply) {
        if (on) apply.setAttribute("aria-busy", "true");
        else apply.removeAttribute("aria-busy");
      }
    };
    const open = () => {
      if (busy) return;
      if (form.hidden) {
        reason.value = "";
        clearError(reason);
      }
      ask.textContent = question(name, !sw.checked);
      form.hidden = false;
      reason.focus();
    };
    const close = () => {
      form.hidden = true;
      reason.value = "";
      clearError(reason);
      sw.focus();
    };

    // A click (and Space, which clicks) would move the switch: stop it and ask instead.
    const onSwitchClick = (e: MouseEvent) => {
      e.preventDefault();
      open();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || busy) return;
      e.preventDefault();
      close();
    };
    const onCancel = () => {
      if (!busy) close();
    };
    const onSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      if (busy) return;
      const text = reason.value.trim();
      if (!text) {
        showError(reason, MISSING, true);
        reason.focus();
        return;
      }
      const next = !sw.checked;
      const held: Array<Promise<unknown>> = [];
      const detail: SwitchAppliedDetail = { checked: next, reason: text, waitUntil: (promise) => void held.push(promise) };
      el.dispatchEvent(new CustomEvent<SwitchAppliedDetail>(EVENT, { bubbles: true, detail }));
      const done = () => {
        setSwitch(label, next);
        close();
      };
      if (held.length === 0) {
        done();
        return;
      }
      clearError(reason);
      setBusy(true);
      Promise.all(held).then(
        () => {
          setBusy(false);
          done();
        },
        (err: unknown) => {
          setBusy(false);
          showError(reason, failedMessage(name, next, err), true);
          reason.focus();
        },
      );
    };

    sw.addEventListener("click", onSwitchClick);
    form.addEventListener("keydown", onKey);
    form.addEventListener("submit", onSubmit);
    cancel?.addEventListener("click", onCancel);
    undo.push(() => {
      sw.removeEventListener("click", onSwitchClick);
      form.removeEventListener("keydown", onKey);
      form.removeEventListener("submit", onSubmit);
      cancel?.removeEventListener("click", onCancel);
      delete el.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
