// Small helpers every React app in the network wrote its own copy of. No framework here: the React
// hooks are in hooks.react.tsx.

/** Joins class names, dropping the empty ones: `cn("cap-btn", busy && "is-busy")`. No merging. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// A value kept in this browser. localStorage where it may be used, a page-long Map where it is
// refused (a private window, blocked storage), so a choice still switches without being kept.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

/** Stores a value (null forgets it) and tells every reader on the page. */
export function writeStored(key: string, value: string | null): void {
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Not kept; still switched, from memory.
  }
  for (const listener of listeners) listener();
}

/** Calls `listener` when a stored value changes here or in another tab. */
export function subscribeStored(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
