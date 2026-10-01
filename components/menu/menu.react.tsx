import { Menu as Base } from "@base-ui/react/menu";
import { useId, type ReactNode } from "react";

export interface MenuAction {
  label: string;
  onSelect?: () => void;
  // Destructive or one-way. Danger items are moved to the end of the menu, after a
  // separator, and drawn in --crit (Primer's rule). The item itself should open the
  // confirm dialog, never act at once.
  danger?: boolean;
  disabled?: boolean;
  // Why the item is disabled, shown under it and read with it. A disabled item stays
  // reachable by the arrow keys so its reason can be read.
  reason?: string;
  // The key that runs this command elsewhere, in aria-keyshortcuts form: "R", "Shift+D",
  // "Control+K". Shown at the item's end.
  shortcut?: string;
}

// A separator between groups of ordinary items.
export type MenuEntry = MenuAction | "separator";

export interface MenuProps {
  // The trigger's visible label: what the menu acts on ("Actions", "More for capsid").
  label: ReactNode;
  // Needed when the label is not plain text, for example an icon-only trigger.
  "aria-label"?: string;
  items: MenuEntry[];
  disabled?: boolean;
  // Where the popup is portalled. Inside a modal <dialog> pass the dialog.
  container?: HTMLElement | null;
  // For specimens and tests: open on mount.
  defaultOpen?: boolean;
}

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m3.5 6 4.5 4.5L12.5 6" />
  </svg>
);

// Ordinary entries first, in their order, with no leading, trailing or doubled separator;
// then the danger items, after one separator.
export function arrangeEntries(items: MenuEntry[]): MenuEntry[] {
  const plain: MenuEntry[] = [];
  for (const e of items) {
    if (e === "separator") {
      if (plain.length > 0 && plain[plain.length - 1] !== "separator") plain.push(e);
    } else if (!e.danger) plain.push(e);
  }
  if (plain[plain.length - 1] === "separator") plain.pop();
  const danger = items.filter((e): e is MenuAction => e !== "separator" && e.danger === true);
  return danger.length > 0 && plain.length > 0 ? [...plain, "separator", ...danger] : [...plain, ...danger];
}

export function Menu({ label, items, disabled = false, container, defaultOpen, ...rest }: MenuProps) {
  const id = useId();
  const entries = arrangeEntries(items);
  return (
    // Not modal: a menu does not lock the page's scroll or cover it with an invisible
    // backdrop. Esc, Tab and a click outside close it; focus returns to the trigger.
    <Base.Root modal={false} disabled={disabled} defaultOpen={defaultOpen}>
      <Base.Trigger className="cap-menu-trigger" aria-label={rest["aria-label"]}>
        {label}
        <Chevron />
      </Base.Trigger>
      <Base.Portal container={container ?? undefined}>
        <Base.Positioner className="cap-menu-positioner" sideOffset={4} align="start">
          <Base.Popup className="cap-menu">
            {entries.map((e, i) =>
              e === "separator" ? (
                <Base.Separator key={`sep-${i}`} className="cap-menu-separator" />
              ) : (
                <Base.Item
                  key={`${e.label}-${i}`}
                  className="cap-menu-item"
                  label={e.label}
                  disabled={e.disabled}
                  onClick={e.onSelect}
                  data-tone={e.danger ? "crit" : undefined}
                  aria-describedby={e.reason ? `${id}-r${i}` : undefined}
                  aria-keyshortcuts={e.shortcut}
                >
                  <span className="cap-menu-label">{e.label}</span>
                  {e.shortcut && (
                    <kbd className="cap-menu-kbd" aria-hidden="true">
                      {e.shortcut}
                    </kbd>
                  )}
                  {/* Hidden from the item's name and read as its description instead. */}
                  {e.reason && (
                    <span className="cap-menu-reason" id={`${id}-r${i}`} aria-hidden="true">
                      {e.reason}
                    </span>
                  )}
                </Base.Item>
              ),
            )}
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
