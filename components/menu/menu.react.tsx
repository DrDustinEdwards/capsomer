import { Menu as Base } from "@base-ui/react/menu";
import { Fragment, useEffect, useId, useRef, type ReactNode } from "react";
import { enhance } from "./menu.ts";

export interface MenuAction {
  type?: "item";
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
  // A small icon before the label.
  icon?: ReactNode;
}

// An item that is on or off, with a check at its end while it is on. The menu stays open
// when it is pressed.
export interface MenuCheckbox {
  type: "checkbox";
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  shortcut?: string;
}

// One choice of several, with a check at its end on the chosen one.
export interface MenuRadioGroup {
  type: "radio-group";
  // A muted heading over the group.
  label?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  items: Array<{ value: string; label: string; disabled?: boolean }>;
}

// Items under a muted heading.
export interface MenuGroup {
  type: "group";
  label: string;
  items: MenuAction[];
}

// An item that opens another menu to its side.
export interface MenuSubmenu {
  type: "submenu";
  label: string;
  items: MenuEntry[];
  disabled?: boolean;
  icon?: ReactNode;
}

// A separator between groups of ordinary items.
export type MenuEntry = MenuAction | MenuCheckbox | MenuRadioGroup | MenuGroup | MenuSubmenu | "separator";

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
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m3.5 6 4.5 4.5L12.5 6" />
  </svg>
);

const ChevronEnd = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m6 3.5 4.5 4.5L6 12.5" />
  </svg>
);

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </svg>
);

const isAction = (e: MenuEntry): e is MenuAction => e !== "separator" && (e.type === undefined || e.type === "item");

// Ordinary entries first, in their order, with no leading, trailing or doubled separator;
// then the danger items, after one separator.
export function arrangeEntries(items: MenuEntry[]): MenuEntry[] {
  const plain: MenuEntry[] = [];
  for (const e of items) {
    if (e === "separator") {
      if (plain.length > 0 && plain[plain.length - 1] !== "separator") plain.push(e);
    } else if (!(isAction(e) && e.danger)) plain.push(e);
  }
  if (plain[plain.length - 1] === "separator") plain.pop();
  const danger = items.filter((e): e is MenuAction => isAction(e) && e.danger === true);
  return danger.length > 0 && plain.length > 0 ? [...plain, "separator", ...danger] : [...plain, ...danger];
}

// The caps of a shortcut: "Shift+R" is two, aria-hidden (the name stays the action, and
// aria-keyshortcuts says the keys).
function Keys({ shortcut }: { shortcut: string }) {
  return (
    <span className="cap-option-keys" aria-hidden="true">
      {shortcut.split("+").map((cap, i) => (
        <Fragment key={`${cap}-${i}`}>
          {i > 0 ? " " : null}
          <kbd className="cap-menu-kbd">{cap}</kbd>
        </Fragment>
      ))}
    </span>
  );
}

function Entries({ entries, id, container }: { entries: MenuEntry[]; id: string; container?: HTMLElement | null }) {
  return (
    <>
      {entries.map((e, i) => {
        const key = `${i}`;
        if (e === "separator") return <Base.Separator key={`sep-${key}`} className="cap-listbox-separator cap-menu-separator" />;
        if (isAction(e)) {
          return (
            <Base.Item
              key={`${e.label}-${key}`}
              className="cap-option cap-menu-item"
              label={e.label}
              disabled={e.disabled}
              onClick={e.onSelect}
              data-tone={e.danger ? "crit" : undefined}
              aria-describedby={e.reason ? `${id}-r${key}` : undefined}
              aria-keyshortcuts={e.shortcut}
            >
              {e.icon ? <span className="cap-option-icon">{e.icon}</span> : null}
              <span className="cap-option-label">{e.label}</span>
              {e.shortcut && <Keys shortcut={e.shortcut} />}
              {/* Hidden from the item's name and read as its description instead. */}
              {e.reason && (
                <span className="cap-menu-reason" id={`${id}-r${key}`} aria-hidden="true">
                  {e.reason}
                </span>
              )}
            </Base.Item>
          );
        }
        if (e.type === "checkbox") {
          return (
            <Base.CheckboxItem key={`${e.label}-${key}`} className="cap-option cap-menu-item" label={e.label} checked={e.checked} defaultChecked={e.defaultChecked} onCheckedChange={e.onCheckedChange} disabled={e.disabled} aria-keyshortcuts={e.shortcut}>
              <span className="cap-option-label">{e.label}</span>
              {e.shortcut && <Keys shortcut={e.shortcut} />}
              <span className="cap-option-indicator" aria-hidden="true">
                <Base.CheckboxItemIndicator>
                  <Check />
                </Base.CheckboxItemIndicator>
              </span>
            </Base.CheckboxItem>
          );
        }
        if (e.type === "radio-group") {
          const group = (
            <Base.RadioGroup value={e.value} defaultValue={e.defaultValue} onValueChange={e.onValueChange ? (v: unknown) => e.onValueChange?.(String(v)) : undefined}>
              {e.items.map((r) => (
                <Base.RadioItem key={r.value} value={r.value} label={r.label} disabled={r.disabled} className="cap-option cap-menu-item">
                  <span className="cap-option-label">{r.label}</span>
                  <span className="cap-option-indicator" aria-hidden="true">
                    <Base.RadioItemIndicator>
                      <Check />
                    </Base.RadioItemIndicator>
                  </span>
                </Base.RadioItem>
              ))}
            </Base.RadioGroup>
          );
          return e.label ? (
            <Base.Group key={`radio-${key}`}>
              <Base.GroupLabel className="cap-listbox-label">{e.label}</Base.GroupLabel>
              {group}
            </Base.Group>
          ) : (
            <Fragment key={`radio-${key}`}>{group}</Fragment>
          );
        }
        if (e.type === "group") {
          return (
            <Base.Group key={`group-${key}`}>
              <Base.GroupLabel className="cap-listbox-label">{e.label}</Base.GroupLabel>
              <Entries entries={e.items} id={`${id}-g${key}`} container={container} />
            </Base.Group>
          );
        }
        return (
          <Base.SubmenuRoot key={`${e.label}-${key}`}>
            <Base.SubmenuTrigger className="cap-option cap-menu-item" label={e.label} disabled={e.disabled}>
              {e.icon ? <span className="cap-option-icon">{e.icon}</span> : null}
              <span className="cap-option-label">{e.label}</span>
              <span className="cap-menu-chevron" aria-hidden="true">
                <ChevronEnd />
              </span>
            </Base.SubmenuTrigger>
            <Base.Portal container={container ?? undefined}>
              <Base.Positioner className="cap-menu-positioner" side="right" align="start" sideOffset={0} alignOffset={-4}>
                <Base.Popup className="cap-popover cap-menu" data-submenu="">
                  <Entries entries={e.items} id={`${id}-s${key}`} container={container} />
                </Base.Popup>
              </Base.Positioner>
            </Base.Portal>
          </Base.SubmenuRoot>
        );
      })}
    </>
  );
}

export function Menu({ label, items, disabled = false, container, defaultOpen, ...rest }: MenuProps) {
  const id = useId();
  const entries = arrangeEntries(items);
  return (
    // Not modal: a menu does not lock the page's scroll or cover it with an invisible
    // backdrop. Esc, Tab and a click outside close it; focus returns to the trigger.
    <Base.Root modal={false} disabled={disabled} defaultOpen={defaultOpen}>
      <Base.Trigger className="cap-btn cap-menu-trigger" aria-label={rest["aria-label"]}>
        {label}
        <Chevron />
      </Base.Trigger>
      <Base.Portal container={container ?? undefined}>
        <Base.Positioner className="cap-menu-positioner" sideOffset={4} align="start">
          <Base.Popup className="cap-popover cap-menu">
            <Entries entries={entries} id={id} container={container} />
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

export interface FormMenuItem {
  // The button's text.
  label: string;
  // Posted as `intent` (or `name`) with the form: what the server is asked to do.
  value: string;
  // Destructive or one-way: moved last, after a separator, and drawn in --crit. The server
  // answers it with its own confirmation page, since this works with no script.
  danger?: boolean;
  // A disabled item stays in the menu with its reason under it in plain text (a native
  // disabled button cannot be reached, so the reason is not hidden behind it).
  disabled?: boolean;
  reason?: string;
}

export interface FormMenuProps {
  // The summary's visible text: what the menu acts on ("Actions for foxhound.app").
  label: ReactNode;
  "aria-label"?: string;
  // Where the form posts, and its method (post unless a GET filter is meant).
  action: string;
  method?: "post" | "get";
  items: FormMenuItem[];
  // The field the button's value goes in. `intent` unless the server expects another name.
  name?: string;
  // Fields every item sends with it: the row's id, a return address.
  hidden?: Record<string, string>;
}

// The row-actions menu with no script: a <details> of submit buttons. Pure markup, so a server
// renders what the browser shows; `enhance` adds Esc, arrow keys and closing on an outside press.
export function FormMenu({ label, action, method = "post", items, name = "intent", hidden, ...rest }: FormMenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => (ref.current ? enhance(ref.current.parentNode ?? document) : undefined), []);
  const ordinary = items.filter((i) => !i.danger);
  const danger = items.filter((i) => i.danger);
  const button = (i: FormMenuItem) => (
    <button key={i.value} type="submit" className="cap-option cap-menu-item" name={name} value={i.value} disabled={i.disabled} data-tone={i.danger ? "crit" : undefined}>
      <span className="cap-option-label">{i.label}</span>
      {i.reason ? <span className="cap-menu-reason">{i.reason}</span> : null}
    </button>
  );
  return (
    <details className="cap-menu-form" data-cap="menu-form" ref={ref}>
      <summary className="cap-btn cap-menu-trigger" aria-label={rest["aria-label"]}>
        {label}
        <Chevron />
      </summary>
      <form className="cap-popover cap-menu" action={action} method={method}>
        {Object.entries(hidden ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {ordinary.map(button)}
        {danger.length && ordinary.length ? <hr className="cap-listbox-separator cap-menu-separator" /> : null}
        {danger.map(button)}
      </form>
    </details>
  );
}
