// A Play button that walks a set of steps on its own (a flow's steps, a tour, a slideshow of
// states): Play, Pause, and "Play again" at the end. It stops at the last step, when the tab is
// hidden and whenever the person moves themselves (a key, a step link), because motion a person did
// not start must be easy to stop (WCAG 2.2.2). Under reduced motion it waits half as long again on
// each step. The page owns the steps; the player only calls go(n).
import { clamp } from "../hooks/hooks.ts";

export interface StepPlayerOptions {
  // The button. Rendered hidden: with no script there is nothing to play, so it is shown here.
  button: HTMLButtonElement | null;
  // The step showing now, from 1.
  current: () => number;
  total: number;
  // Shows step n (1 to total).
  go: (n: number) => void;
  // Milliseconds on each step (3600). Reduced motion multiplies it by `reducedFactor` (1.5).
  interval?: number;
  reducedFactor?: number;
  labels?: { play?: string; pause?: string; again?: string };
}

export interface StepPlayer {
  start(): void;
  stop(): void;
  playing(): boolean;
  // Removes the listeners and stops; the button is hidden again.
  destroy(): void;
}

export const STEP_MS = 3600;

const reducedMotion = (): boolean =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// The wait on a step: read at each start, so a preference changed mid-page is honored next play.
export function stepDelay(
  interval = STEP_MS,
  reducedFactor = 1.5,
  reduced = reducedMotion(),
): number {
  return reduced ? interval * reducedFactor : interval;
}

const NOOP: StepPlayer = { start() {}, stop() {}, playing: () => false, destroy() {} };

export function stepPlayer(options: StepPlayerOptions): StepPlayer {
  const { button, current, total, go } = options;
  if (!button || total < 2) return NOOP;
  const words = { play: "Play", pause: "Pause", again: "Play again", ...options.labels };
  let timer: ReturnType<typeof setInterval> | 0 = 0;

  const label = () => {
    button.textContent = timer ? words.pause : current() >= total ? words.again : words.play;
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = 0;
    label();
  };
  const start = () => {
    if (timer) return;
    if (current() >= total) go(1);
    timer = setInterval(
      () => {
        if (current() >= total) return stop();
        go(current() + 1);
        if (current() >= total) stop();
      },
      stepDelay(options.interval, options.reducedFactor),
    );
    label();
  };
  const onClick = () => (timer ? stop() : start());
  const onVisibility = () => {
    if (document.hidden) stop();
  };

  button.hidden = false;
  // The label changes as it plays; a live announcement each step would talk over the step itself.
  button.setAttribute("aria-live", "off");
  button.addEventListener("click", onClick);
  document.addEventListener("visibilitychange", onVisibility);
  label();

  return {
    start,
    stop,
    playing: () => timer !== 0,
    destroy() {
      stop();
      button.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      button.hidden = true;
    },
  };
}

// Attaches a player to every [data-cap="step-player"] root: its steps are the [data-step] children
// (one shown, the rest hidden), its button [data-step-play]. A key pressed in the root, or a click on
// a [data-step-go] link, stops it: the person has taken over.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const host of root.querySelectorAll<HTMLElement>(
    '[data-cap="step-player"]:not([data-cap-ready])',
  )) {
    host.dataset.capReady = "";
    const steps = [...host.querySelectorAll<HTMLElement>("[data-step]")];
    let at = Math.max(1, steps.findIndex((s) => !s.hidden) + 1);
    const show = (n: number) => {
      at = n;
      steps.forEach((s, i) => (s.hidden = i !== n - 1));
      host.dataset.stepAt = String(n);
    };
    const player = stepPlayer({
      button: host.querySelector<HTMLButtonElement>("[data-step-play]"),
      current: () => at,
      total: steps.length,
      go: show,
      interval: Number(host.dataset.stepInterval) || undefined,
    });
    // The play button's own Enter and Space are its click, which plays or pauses.
    const onKey = (event: KeyboardEvent) => {
      if (!(event.target as Element).closest("[data-step-play]")) player.stop();
    };
    const onGo = (event: Event) => {
      const link = (event.target as Element).closest<HTMLElement>("[data-step-go]");
      if (!link) return;
      event.preventDefault();
      show(clamp(Number(link.dataset.stepGo) || 1, 1, steps.length));
      // After the move, so the button's word fits the step now shown ("Play again" on the last).
      player.stop();
    };
    host.addEventListener("keydown", onKey);
    host.addEventListener("click", onGo);
    undo.push(() => {
      player.destroy();
      host.removeEventListener("keydown", onKey);
      host.removeEventListener("click", onGo);
      delete host.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
