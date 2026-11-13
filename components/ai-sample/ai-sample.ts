// The AI sample's behavior on a page that does not hydrate, as the React view behaves: choosing another input
// clears the last sample; Generate says its busy label while the call runs, then shows the sample or the failure
// line. Every write is textContent: generated text is never markup.
// Extracted from Foxhound's email generator island (app/islands/email-generator.ts) in 0.123.0.

export interface AiSampleField {
  label: string;
  value: string;
  // The body of an email: monospaced, keeps its line breaks.
  mono?: boolean;
}

export type AiSampleResult = { fields: AiSampleField[]; note?: string } | { error: true };

export interface AiSampleOptions {
  // Runs the model on the form's inputs. A result without fields, or a throw, is a failed generation.
  generate: (data: FormData) => Promise<AiSampleResult>;
  // The failure line.
  failed?: string;
}

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Draws a sample, the failure line, or nothing, into the live region. Exported for a page that runs its own
// request; `enhance()` uses it.
export function drawSample(
  out: HTMLElement,
  result: AiSampleResult | null,
  failed = "Generation failed. Try again.",
): void {
  out.replaceChildren();
  if (!result) return;
  if ("error" in result || result.fields.length === 0) {
    out.append(node("p", "cap-ai-sample-error", failed));
    return;
  }
  const box = node("div", "cap-ai-sample-result");
  for (const f of result.fields) {
    const value = node("div", "cap-ai-sample-field", f.value);
    if (f.mono) value.dataset.variant = "mono";
    box.append(node("p", "cap-ai-sample-label", f.label), value);
  }
  if (result.note) box.append(node("p", "cap-ai-sample-note", result.note));
  out.append(box);
}

// Wires every `[data-cap="ai-sample"]`: a form holding the inputs, a `[data-ai-sample-generate]` button whose
// `data-busy-label` is said while the call runs, and a `.cap-ai-sample-out` live region.
export function enhance(root: ParentNode = document, options: AiSampleOptions): () => void {
  const undo: Array<() => void> = [];
  for (const form of root.querySelectorAll<HTMLFormElement>(
    'form[data-cap="ai-sample"]:not([data-cap-ready])',
  )) {
    const button = form.querySelector<HTMLButtonElement>("[data-ai-sample-generate]");
    const out = form.querySelector<HTMLElement>(".cap-ai-sample-out");
    if (!button || !out) continue;
    form.dataset.capReady = "";
    const idle = [...button.childNodes].map((n) => n.cloneNode(true));
    const busy = node("span", "cap-btn-label", button.dataset.busyLabel ?? "Generating...");
    // A newer call wins: a slower earlier one landing late never replaces it.
    let call = 0;

    const setBusy = (on: boolean) => {
      button.disabled = on;
      if (on) button.setAttribute("aria-busy", "true");
      else button.removeAttribute("aria-busy");
      button.replaceChildren(...(on ? [busy] : idle.map((n) => n.cloneNode(true))));
    };
    const onChange = () => drawSample(out, null);
    const run = async () => {
      const mine = ++call;
      drawSample(out, null);
      setBusy(true);
      let result: AiSampleResult;
      try {
        result = await options.generate(new FormData(form));
      } catch {
        result = { error: true };
      }
      if (mine !== call) return;
      setBusy(false);
      drawSample(out, result, options.failed);
    };
    const onSubmit = (e: Event) => {
      e.preventDefault();
      void run();
    };
    form.addEventListener("change", onChange);
    form.addEventListener("submit", onSubmit);
    undo.push(() => {
      form.removeEventListener("change", onChange);
      form.removeEventListener("submit", onSubmit);
    });
  }
  return () => {
    for (const u of undo) u();
  };
}
