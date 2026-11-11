// The sortable list's grip, step arrows and announcer, shared by the list and the groups.
import { useState } from "react";

export const Grip = () => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="6" cy="3.5" r="1.25" />
    <circle cx="10" cy="3.5" r="1.25" />
    <circle cx="6" cy="8" r="1.25" />
    <circle cx="10" cy="8" r="1.25" />
    <circle cx="6" cy="12.5" r="1.25" />
    <circle cx="10" cy="12.5" r="1.25" />
  </svg>
);
export const Arrow = ({ up }: { up: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={up ? "M8 13V3M3.5 7.5 8 3l4.5 4.5" : "M8 3v10M3.5 8.5 8 13l4.5-4.5"} />
  </svg>
);

// What a move says: through the app's own announcer, or into the list's own live region. The same
// sentence twice gets a no-break space, so a screen reader reads it again.
export function useSay(announce?: (text: string) => void): [string, (text: string) => void] {
  const [said, setSaid] = useState("");
  const say = (text: string) =>
    announce ? announce(text) : setSaid((prev) => (prev === text ? `${text} ` : text));
  return [said, say];
}

// An item's words by its id; the id itself when the item is gone.
export function labelFor<T>(byId: Map<string, T>, getLabel: (item: T) => string) {
  return (id: string) => {
    const it = byId.get(id);
    return it === undefined ? id : getLabel(it);
  };
}
