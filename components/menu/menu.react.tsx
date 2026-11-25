import { Menu as Base } from "@base-ui/react/menu";
import { Fragment, useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { Icon, iconChevronDown, iconChevronRight } from "../icons/icons.react.tsx";
import { enhance } from "./menu.ts";

export interface MenuAction {
  type?: "item";
  label: string;
  onSelect?: () => void;
  // Destructive or one-way: moved to the end after a separator and drawn in --crit. The item should
  // open the confirm dialog, never act at once.
  danger?: boolean;
  disabled?: boolean;
  // Why the item is disabled, shown under it and read with it. A disabled item stays reachable by
  // arrow keys so its reason can be read.
  reason?: string;
  // The key that runs this command elsewhere, in aria-keyshortcuts form. Shown at the item's end.
  shortcut?: string;
  icon?: ReactNode;
}

// An item that is on or off, with a check while on. The menu stays open when it is pressed.
export interface MenuCheckbox {
  type: "checkbox";
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  shortcut?: string;
}

export interface MenuRadioGroup {
  type: "radio-group";
  label?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  // Close the menu once a choice is made (a list of places to jump to); a setting stays open.
  closeOnClick?: boolean;
  items: Array<{ value: string; label: string; disabled?: boolean }>;
}

export interface MenuGroup {
  type: "group";
  label: string;
  items: MenuAction[];
}

export interface MenuSubmenu {
  type: "submenu";
  label: string;
  items: MenuEntry[];
  disabled?: boolean;
  icon?: ReactNode;
}

export type MenuEntry =
  | MenuAction
  | MenuCheckbox
  | MenuRadioGroup
  | MenuGroup
  | MenuSubmenu
  | "separator";

export interface MenuProps {
  label: ReactNode;
  // Needed when the label is not plain text, such as an icon-only trigger.
  "aria-label"?: string;
  items: MenuEntry[];
  disabled?: boolean;
  // Where the popup is portaled. Inside a modal <dialog> pass the dialog.
  container?: HTMLElement | null;
  defaultOpen?: boolean;
  // The trigger's down chevron; false for an icon trigger that says what it opens.
  chevron?: boolean;
}

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.5 8.5 6.5 11.5 12.5 4.5"
    />
  </svg>
);

const isAction = (e: MenuEntry): e is MenuAction =>
  e !== "separator" && (e.type === undefined || e.type === "item");

// Ordinary entries first with no leading, trailing or doubled separator, then danger items after one separator.
export function arrangeEntries(items: MenuEntry[]): MenuEntry[] {
  const plain: MenuEntry[] = [];
  for (const e of items) {
    if (e === "separator") {
      if (plain.length > 0 && plain[plain.length - 1] !== "separator") plain.push(e);
    } else if (!(isAction(e) && e.danger)) plain.push(e);
  }
  if (plain[plain.length - 1] === "separator") plain.pop();
  const danger = items.filter((e): e is MenuAction => isAction(e) && e.danger === true);
  return danger.length > 0 && plain.length > 0
    ? [...plain, "separator", ...danger]
    : [...plain, ...danger];
}

// The caps of a shortcut, aria-hidden: the name stays the action and aria-keyshortcuts says the keys.
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

function Entries({
  entries,
  id,
  container,
}: {
  entries: MenuEntry[];
  id: string;
  container?: HTMLElement | null;
}) {
  return (
    <>
      {entries.map((e, i) => {
        const key = `${i}`;
        if (e === "separator")
          return (
            <Base.Separator
              key={`sep-${key}`}
              className="cap-listbox-separator cap-menu-separator"
            />
          );
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
            <Base.CheckboxItem
              key={`${e.label}-${key}`}
              className="cap-option cap-menu-item"
              label={e.label}
              checked={e.checked}
              defaultChecked={e.defaultChecked}
              onCheckedChange={e.onCheckedChange}
              disabled={e.disabled}
              aria-keyshortcuts={e.shortcut}
            >
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
            <Base.RadioGroup
              value={e.value}
              defaultValue={e.defaultValue}
              onValueChange={
                e.onValueChange ? (v: unknown) => e.onValueChange?.(String(v)) : undefined
              }
            >
              {e.items.map((r) => (
                <Base.RadioItem
                  key={r.value}
                  value={r.value}
                  label={r.label}
                  disabled={r.disabled}
                  closeOnClick={e.closeOnClick}
                  className="cap-option cap-menu-item"
                >
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
            <Base.SubmenuTrigger
              className="cap-option cap-menu-item"
              label={e.label}
              disabled={e.disabled}
            >
              {e.icon ? <span className="cap-option-icon">{e.icon}</span> : null}
              <span className="cap-option-label">{e.label}</span>
              <span className="cap-menu-chevron" aria-hidden="true">
                <Icon d={iconChevronRight} />
              </span>
            </Base.SubmenuTrigger>
            <Base.Portal container={container ?? undefined}>
              <Base.Positioner
                className="cap-menu-positioner"
                side="right"
                align="start"
                sideOffset={0}
                alignOffset={-4}
              >
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

export function Menu({
  label,
  items,
  disabled = false,
  container,
  defaultOpen,
  chevron = true,
  ...rest
}: MenuProps) {
  const id = useId();
  const entries = arrangeEntries(items);
  return (
    // Not modal: a menu does not lock scroll or cover the page. Esc, Tab and an outside click close it; focus returns to the trigger.
    <Base.Root modal={false} disabled={disabled} defaultOpen={defaultOpen}>
      <Base.Trigger className="cap-btn cap-menu-trigger" aria-label={rest["aria-label"]}>
        {label}
        {chevron ? <Icon d={iconChevronDown} /> : null}
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
  label: string;
  // Posted as `intent` (or `name`) with the form; for a link item it is only the item's key.
  value: string;
  // A link item goes somewhere instead of posting; never danger.
  href?: string;
  // Destructive or one-way: moved last after a separator, drawn in --crit. The server answers with its
  // own confirmation page, since this works with no script.
  danger?: boolean;
  // A disabled item stays in the menu with its reason in plain text; a native disabled button cannot be reached.
  disabled?: boolean;
  reason?: string;
  // A link item that script turns into an action: with script a press calls this instead of following
  // the link; without, the link goes to the page that does it. Only such a link may be a danger item.
  onSelect?: () => void;
}

export interface FormMenuProps {
  label: ReactNode;
  "aria-label"?: string;
  // Where the form posts, and its method. Not needed with `form`.
  action?: string;
  // The id of a form elsewhere on the page that the items submit: the menu renders no form of its
  // own and each item's button names that form. `hidden` is then not sent.
  form?: string;
  size?: "sm";
  method?: "post" | "get";
  items: FormMenuItem[];
  name?: string;
  hidden?: Record<string, string>;
}

// The row-actions menu with no script: a <details> of submit buttons. `enhance` adds Esc, arrow keys and outside-press close.
export function FormMenu({
  label,
  action,
  method = "post",
  items,
  name = "intent",
  hidden,
  form,
  size,
  ...rest
}: FormMenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => (ref.current ? enhance(ref.current) : undefined), []);
  const ordinary = items.filter((i) => !i.danger);
  const danger = items.filter((i) => i.danger);
  const select = (i: FormMenuItem) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!i.onSelect) return;
    e.preventDefault();
    if (ref.current) ref.current.open = false;
    i.onSelect();
  };
  const button = (i: FormMenuItem) =>
    i.href && (!i.danger || i.onSelect) ? (
      <a
        key={i.value}
        className="cap-option cap-menu-item"
        href={i.href}
        onClick={select(i)}
        data-tone={i.danger ? "crit" : undefined}
      >
        <span className="cap-option-label">{i.label}</span>
      </a>
    ) : (
      <button
        key={i.value}
        type="submit"
        className="cap-option cap-menu-item"
        name={name}
        value={i.value}
        form={form}
        disabled={i.disabled}
        onClick={() => {
          // A press posts; close the menu so it is not left open over the page.
          if (ref.current) ref.current.open = false;
        }}
        data-tone={i.danger ? "crit" : undefined}
      >
        <span className="cap-option-label">{i.label}</span>
        {i.reason ? <span className="cap-menu-reason">{i.reason}</span> : null}
      </button>
    );
  const entries = (
    <>
      {ordinary.map(button)}
      {danger.length && ordinary.length ? (
        <hr className="cap-listbox-separator cap-menu-separator" />
      ) : null}
      {danger.map(button)}
    </>
  );
  return (
    <details className="cap-menu-form" data-cap="menu-form" ref={ref}>
      <summary
        className="cap-btn cap-menu-trigger"
        data-size={size}
        aria-label={rest["aria-label"]}
      >
        {label}
        <Icon d={iconChevronDown} />
      </summary>
      {form ? (
        <div className="cap-popover cap-menu">{entries}</div>
      ) : (
        <form className="cap-popover cap-menu" action={action} method={method}>
          {Object.entries(hidden ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          {entries}
        </form>
      )}
    </details>
  );
}
