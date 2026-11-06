// The media inspector's autosave.

// ---------------------------------------------------------------------------------------
// Autosave, pure. It waits until typing stops, saves, and says where it is. A change that
// arrives while a save runs is saved after it. Nothing here touches the fields, so what was
// typed is never lost: a failure only changes the state.

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "failed";

export interface AutosaveOptions {
  // Milliseconds of quiet before a save: 800.
  delay?: number;
  // Reads the fields and sends them. Called synchronously when a save starts, so what it reads is
  // what the person had typed at that moment. Reject with an Error that says why.
  save: () => Promise<void>;
  onState?: (state: SaveState, error?: string) => void;
}

export interface Autosave {
  // A change was made: save when typing stops.
  schedule(): void;
  // Save now, if there is anything unsaved (a field lost focus).
  flush(): Promise<void>;
  // Try again after a failure.
  retry(): Promise<void>;
  state(): SaveState;
  // Forget the timer (the inspector moved to another file).
  cancel(): void;
}

export const AUTOSAVE_MS = 800;

export function createAutosave(opts: AutosaveOptions): Autosave {
  const delay = opts.delay ?? AUTOSAVE_MS;
  let state: SaveState = "idle";
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;
  let again = false;
  const set = (s: SaveState, error?: string) => {
    state = s;
    opts.onState?.(s, error);
  };
  const stop = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const run = (): Promise<void> => {
    stop();
    if (running) {
      again = true;
      return running;
    }
    set("saving");
    let pending: Promise<void>;
    try {
      pending = opts.save();
    } catch (err) {
      pending = Promise.reject(err);
    }
    running = pending
      .then(
        () => {
          running = null;
          if (again) {
            again = false;
            return run();
          }
          set("saved");
          return undefined;
        },
        (err: unknown) => {
          running = null;
          again = false;
          set("failed", err instanceof Error && err.message ? err.message : "Nothing says why.");
        },
      )
      .then(() => undefined);
    return running;
  };
  return {
    schedule() {
      if (running) again = true;
      else set("dirty");
      stop();
      timer = setTimeout(() => void run(), delay);
    },
    flush() {
      if (running) {
        again = again || state === "dirty";
        return running;
      }
      if (state === "dirty") return run();
      return Promise.resolve();
    },
    retry() {
      return run();
    },
    state: () => state,
    cancel: stop,
  };
}

