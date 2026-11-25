// The filter bar's behavior: address-state helpers a loader and a link both use, and a debounced submit for a bar that applies as you type.

export type Params = Record<string, string | number | null | undefined>;

// `path` with `params` as its query, leaving out empty and default values so one view has one address.
export function withParams(path: string, params: Params, defaults: Params = {}): string {
  const q = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (raw === null || raw === undefined) continue;
    const value = String(raw).trim();
    if (value === "" || value === String(defaults[key] ?? "")) continue;
    q.set(key, value);
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export function clearedHref(path: string, params: Params, keep: readonly string[] = []): string {
  const kept: Params = {};
  for (const key of keep) kept[key] = params[key];
  return withParams(path, kept);
}

export function isFiltered(
  params: Params,
  keys: readonly string[],
  defaults: Params = {},
): boolean {
  return keys.some((k) => {
    const v = params[k];
    return (
      v !== null &&
      v !== undefined &&
      String(v).trim() !== "" &&
      String(v) !== String(defaults[k] ?? "")
    );
  });
}

export const SEARCH_DELAY_MS = 300;

// Submits after typing stops, at once for a select, checkbox or radio. Nothing is sent during an IME composition; its end counts as typing.
export function liveSubmit(form: HTMLFormElement, delay = SEARCH_DELAY_MS): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let composing = false;
  const send = () => {
    clearTimeout(timer);
    form.requestSubmit();
  };
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(send, delay);
  };
  const isText = (el: EventTarget | null) =>
    el instanceof HTMLInputElement &&
    ![
      "checkbox",
      "radio",
      "range",
      "date",
      "month",
      "week",
      "time",
      "datetime-local",
      "color",
    ].includes(el.type);
  const onInput = (e: Event) => {
    if (composing || (e as InputEvent).isComposing) return;
    if (isText(e.target) || e.target instanceof HTMLTextAreaElement) later();
  };
  const onChange = (e: Event) => {
    if (!isText(e.target) && !(e.target instanceof HTMLTextAreaElement)) send();
  };
  const onStart = () => {
    composing = true;
    clearTimeout(timer);
  };
  const onEnd = () => {
    composing = false;
    later();
  };
  form.addEventListener("input", onInput);
  form.addEventListener("change", onChange);
  form.addEventListener("compositionstart", onStart);
  form.addEventListener("compositionend", onEnd);
  return () => {
    clearTimeout(timer);
    form.removeEventListener("input", onInput);
    form.removeEventListener("change", onChange);
    form.removeEventListener("compositionstart", onStart);
    form.removeEventListener("compositionend", onEnd);
  };
}

export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const form of Array.from(
    root.querySelectorAll<HTMLFormElement>(
      "form[data-cap='filter-bar'][data-live]:not([data-cap-ready])",
    ),
  )) {
    form.dataset.capReady = "";
    const stop = liveSubmit(form, Number(form.dataset.delay) || SEARCH_DELAY_MS);
    undo.push(() => {
      stop();
      delete form.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
