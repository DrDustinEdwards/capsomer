// The sortable list's props: the list, the board, a lane, a move and the state an item is drawn from
// (sortable-list.react.tsx renders them).
import type { ReactNode } from "react";
import type { Layout, Lists, SortMessages, SortMove } from "./sortable-list.ts";

export interface SortState {
  index: number;
  lifted: boolean;
  // The id of the list the item is in ("" for a SortableList).
  list: string;
}

export interface CoreProps<T> {
  getId: (item: T) => string;
  // The words a person knows the item by: "Move {label}", "Picked up {label}".
  getLabel: (item: T) => string;
  // The item's own content, beside the handle and the buttons. No drag handle of its own.
  renderItem: (item: T, state: SortState) => ReactNode;
  // A line between the handle and the buttons, in the item's head: "Step 3", an item's title. In
  // the "cards" and "stack" layouts the head sits over the content.
  renderHead?: (item: T, state: SortState) => ReactNode;
  // "rows" (the default), "cards" (a wrapping grid) or "stack" (a card per line, the head over the
  // content, for an item whose body is fields).
  layout?: Layout;
  // Says what the list says in the host's own words: any of the sentences in `sortText`.
  messages?: Partial<SortMessages>;
  // Alt and Up or Down anywhere in an item moves it one place, as the buttons do (not from a
  // select, where Alt+Down opens it). The buttons name the shortcut with aria-keyshortcuts.
  altKeys?: boolean;
  // Shows the order with no handle and no buttons: a published book, a locked list.
  readOnly?: boolean;
  // A move or save is under way: every control is disabled.
  busy?: boolean;
  // Remove: a button after Move down. `onRemove` hears it; the list says so and puts focus on the
  // next item. Not offered at `min` items or fewer.
  onRemove?: (id: string, at: { index: number; list: string }) => void;
  min?: number;
  // Said in place of an empty list: "No hosts yet."
  empty?: ReactNode;
  // The first number of the ordered list (`start` of the `ol`).
  start?: number;
  // The form field name for the order; turns the buttons into submit buttons.
  name?: string;
  className?: string;
  // How Move up and Move down are drawn: "quiet" icon buttons (the default), "bordered" icon
  // buttons, or "labeled" bordered buttons with the words Up and Down.
  steps?: "quiet" | "bordered" | "labeled";
  // The grip; on by default. Off, the item has no drag handle and moves by its buttons (and Alt
  // and an arrow, with altKeys).
  grip?: boolean;
  // A class of the site's own on an item, for a state it draws (an excluded entry).
  itemClassName?: (item: T, state: SortState) => string | undefined;
  // The site's own controls in the item's buttons, after the steps and the move-to select and
  // before Remove (a checkbox, say).
  renderControls?: (item: T, state: SortState) => ReactNode;
  // A part after the buttons, the item's full width: an "Edit item" disclosure that belongs under the
  // item's title and its buttons rather than beside them.
  renderFoot?: (item: T, state: SortState) => ReactNode;
  // How Remove is drawn: "quiet" (the default, bare words) or "bordered" (a boxed button).
  removeStyle?: "quiet" | "bordered";
}

export interface SortableListProps<T> extends CoreProps<T> {
  items: readonly T[];
  onReorder: (order: string[], move: SortMove) => void;
  // Add: a button under the list that calls `onAdd` (the host appends the item), then says so and
  // puts focus in the new item's first field. Off at `max` items.
  onAdd?: () => void;
  addLabel?: string;
  max?: number;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export interface SortLane<T> {
  id: string;
  // What the list is called: the name of its list, said when an item moves into it, and the label of
  // its option in the move-to select.
  label: string;
  items: readonly T[];
  // Said in place of this list's items when it has none: "Empty. Drag an abstract here."
  empty?: ReactNode;
}

export interface BoardMove extends SortMove {
  fromList: string;
  toList: string;
}

export interface SortableBoardProps<T> extends CoreProps<T> {
  lanes: readonly SortLane<T>[];
  // Every list's new order, and what moved. The host saves it.
  onMove: (lists: Lists, move: BoardMove) => void;
  // The heading or heading and note above a list's items. Wrapped in the list's section.
  renderLaneHead?: (lane: SortLane<T>) => ReactNode;
  // A select in each item to move it to another list: the one-pointer way across lists
  // (WCAG 2.5.7). On by default.
  moveTo?: boolean;
  // A class of the site's own on a list's section (.cap-sortable-lane), for its look.
  laneClassName?: string | ((lane: SortLane<T>) => string | undefined);
  "aria-label"?: string;
}

export interface CoreInput<T> extends CoreProps<T> {
  lanes: readonly SortLane<T>[];
  board: boolean;
  onChange: (lists: Lists, move: BoardMove) => void;
  onAdd?: () => void;
  addLabel?: string;
  max?: number;
  moveTo?: boolean;
  renderLaneHead?: (lane: SortLane<T>) => ReactNode;
  laneClassName?: string | ((lane: SortLane<T>) => string | undefined);
  label: { "aria-label"?: string; "aria-labelledby"?: string };
}
