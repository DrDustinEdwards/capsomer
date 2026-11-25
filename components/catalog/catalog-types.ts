// The catalog's types: what a collection declares and what a query returns. catalog-core.ts re-exports them.

export type CatalogValue = string | number | boolean | null | undefined;

export interface CatalogFacet<T = unknown> {
  // "many": values of the field combine with "or" (checkboxes). "one": a single value (radios, with "Any").
  // "range": a span of numbers (years) chosen from two menus, From and To; an item matches when its own
  // span overlaps the chosen one.
  kind?: "one" | "many" | "range";
  // A range facet: the span an item covers (a post's year as [2024, 2024], a job held 2019 to now as
  // [2019, Infinity]), or null for an item with none, which no range matches. Default: the field's
  // numeric values, lowest to highest.
  span?: (item: T) => readonly [number, number] | null;
  // A range facet's two URL parameters. Default "<key>-from" and "<key>-to".
  params?: { from: string; to: string };
  // General facets are listed first and start open; the rest start folded.
  general?: boolean;
  // The options' order: most items first (default), alphabetical, or a fixed list.
  order?: "count" | "alpha" | readonly string[];
  // How a value reads as an option and as a chip, when the value is not already words.
  label?: (value: string) => string;
  // How many options show before "Show more". Default 8.
  limit?: number;
}

export interface CatalogColumn {
  header?: string;
  align?: "end";
  // Opt in to dropping the column on a narrow region (the table's `data-drop`).
  drop?: 1 | 2;
  // A small note under the header ("last 24 hours").
  note?: string;
  // The column is left out while the rows are grouped, because the group heading already says it (a Year column
  // under year headings). It shows again in every flat view.
  hideWhenGrouped?: boolean;
}

// Rows under headings, in the default order only. The group field must be the one the default sort orders by, so
// each heading's rows are together; a search or another sort shows the same rows flat.
export interface CatalogGroup<T> {
  // The sortable field the default sort orders by (its key, not "-key").
  field: string;
  // What puts an item in a group, when the field's own value is finer than a heading (a month, not a day).
  value?: (item: T) => string;
  // How a group's value reads as its heading. Default: the value.
  label?: (value: string) => string;
  // The heading for items with no value (default "Other": "Undated" for years).
  empty?: string;
}

export interface CatalogSort<T> {
  // How the two directions read in the sort menu. Defaults follow the field's `type`.
  labels?: { asc: string; desc: string };
  // Replaces comparing the field's value: for a field whose order is not alphabetical or numeric.
  compare?: (a: T, b: T) => number;
}

export interface CatalogField<T> {
  // The field's name, and its URL parameter when it is a facet. Not q, sort or page.
  key: string;
  label: string;
  // What the field says about one item: a value, a list of values, or nothing.
  value: (item: T) => CatalogValue | readonly CatalogValue[];
  // The field is typed by the search box. A number is its weight in the ranking (true is 1).
  search?: boolean | number;
  facet?: CatalogFacet<T>;
  column?: CatalogColumn;
  sort?: boolean | CatalogSort<T>;
  // Reading and ordering: text (A to Z), number (low to high) or date (oldest first, ISO strings).
  type?: "text" | "number" | "date";
}

export interface CatalogDefinition<T> {
  // Names the live regions and the form: unique on a page.
  id: string;
  // The items' name, singular and plural, for the count ("3 of 14 articles").
  noun: readonly [string, string];
  // The page's address, with no query: the canonical, and where every filtered address is built from.
  basePath: string;
  fields: readonly CatalogField<T>[];
  itemKey: (item: T) => string;
  // The order with nothing typed: a field key, "-" first for descending ("-updated").
  defaultSort?: string;
  // Rows per page; leave out for one page.
  pageSize?: number;
  // Headings over the rows in the default order (see CatalogGroup).
  group?: CatalogGroup<T>;
}

export interface CatalogState {
  q: string;
  filters: Record<string, string[]>;
  // "" is the default order (best match while a search is typed).
  sort: string;
  page: number;
}

export interface CatalogOption {
  value: string;
  label: string;
  // Items that would match with this option chosen, the other filters held.
  count: number;
  selected: boolean;
}

export interface CatalogRange {
  // The chosen ends, null when open.
  from: number | null;
  to: number | null;
  // The URL parameters the two menus submit.
  params: { from: string; to: string };
  // Every value an item covers, lowest first: the menus' options.
  values: number[];
}

export interface CatalogFacetResult {
  key: string;
  label: string;
  kind: "one" | "many" | "range";
  // A range facet's ends and choices; its options are each value with the items that cover it.
  range?: CatalogRange;
  general: boolean;
  limit: number;
  options: CatalogOption[];
  selected: number;
}

export interface CatalogChip {
  id: string;
  field: string;
  value: string;
  // "Topic: Pricing", or the search typed in quotes.
  label: string;
  // The address with this one filter removed: a link that works with no script.
  href: string;
}

export interface CatalogSortOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface CatalogRowGroup<T> {
  value: string;
  label: string;
  rows: T[];
}

export interface CatalogResult<T> {
  state: CatalogState;
  total: number;
  count: number;
  rows: T[];
  // The shown rows under their headings, or null when the view is flat (a search, another sort, or no group declared).
  groups: CatalogRowGroup<T>[] | null;
  page: number;
  pageCount: number;
  // The 1-based position of the first and last row shown, of `count`.
  from: number;
  to: number;
  facets: CatalogFacetResult[];
  chips: CatalogChip[];
  clearHref: string | null;
  sorts: CatalogSortOption[];
  // The address for this state with changes; with none, the current address.
  href: (change?: Partial<CatalogState>) => string;
}
