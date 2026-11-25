// The media inspector's autosave, pure: it waits until typing stops, saves, and says where it is. A change
// arriving mid-save is saved after it. Nothing here touches the fields, so typed text is never lost.

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "failed";

export const SAVE_TEXT: Record<SaveState, string> = {
  idle: "Changes save by themselves.",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  failed: "Could not save",
};

export interface AutosaveOptions {
  delay?: number;
  // Reads the fields and sends them; called synchronously when a save starts. Reject with an Error that says why.
  save: () => Promise<void>;
  onState?: (state: SaveState, error?: string) => void;
}

export interface Autosave {
  schedule(): void;
  flush(): Promise<void>;
  retry(): Promise<void>;
  state(): SaveState;
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
