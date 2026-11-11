import { useId, useState, type ReactNode } from "react";

export interface DisclosureProps {
  summary: ReactNode;
  children: ReactNode;
  // Sections that share a name open one at a time.
  name?: string;
  defaultOpen?: boolean;
  // "accordion": shadcn's flat look, a rule between items and the chevron at the end. "card": each
  // section its own rounded card, with a plus that turns to a cross. "inline": no box, a rule above
  // and below, the title in the link color (a post's "Show the data", a procedure step's calculator).
  variant?: "accordion" | "card" | "inline";
  // "sm" on the card: the compact card for a form or a list behind its title.
  size?: "sm";
  // "sign": a mono plus that becomes a minus, in place of the chevron. "triangle": a small
  // triangle at the start, as the browser's own, in place of the variant's chevron or plus.
  marker?: "sign" | "triangle";
  // Sections are open on paper. "hide" leaves this one off the printed page (a calculator).
  print?: "hide";
  className?: string;
}

// A show/hide section: native <details>, so it works before JavaScript and with none.
export function Disclosure({
  summary,
  children,
  name,
  defaultOpen = false,
  variant,
  size,
  marker,
  print,
  className,
}: DisclosureProps) {
  return (
    <details
      className={className ? `cap-disclosure ${className}` : "cap-disclosure"}
      data-variant={variant}
      data-size={size}
      data-marker={marker}
      data-print={print}
      name={name}
      open={defaultOpen || undefined}
    >
      <summary>{summary}</summary>
      <div className="cap-disclosure-body">{children}</div>
    </details>
  );
}

export interface GroupProps {
  // What the rows are: "Notices".
  label: string;
  // How many rows it holds; read as "Notices, 4".
  count: number;
  // The grouped rows, as <li> elements.
  children: ReactNode;
  defaultExpanded?: boolean;
  // Critical rows are never collapsed: true keeps the group open.
  holdsCritical?: boolean;
  // Puts the button in a heading of this level, so a person moving by heading finds the group.
  headingLevel?: 2 | 3 | 4;
}

// A group row in a list: a button that shows or hides the rows it groups.
export function Group({
  label,
  count,
  children,
  defaultExpanded = false,
  holdsCritical = false,
  headingLevel,
}: GroupProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultExpanded || holdsCritical);
  const expanded = open || holdsCritical;
  const Heading = headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "h4";
  const toggle = (
    <button
      type="button"
      className="cap-group-toggle"
      aria-expanded={expanded}
      aria-controls={id}
      onClick={() => setOpen(!expanded)}
    >
      <span className="cap-group-label">{label}</span>
      <span className="cap-sr-only">, </span>
      <span className="cap-group-count">{count}</span>
    </button>
  );
  return (
    <div className="cap-group" data-cap="disclosure">
      {headingLevel ? <Heading className="cap-group-heading">{toggle}</Heading> : toggle}
      <ul className="cap-group-rows" id={id} hidden={!expanded}>
        {children}
      </ul>
    </div>
  );
}

// One region shown or hidden by a toggle beside it: the state, and the props for the button and
// the region. For a list of rows that open one at a time, keep the open id in the parent instead.
export function useExpand(defaultOpen = false) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return {
    open,
    setOpen,
    toggle: { "aria-expanded": open, "aria-controls": id, onClick: () => setOpen(!open) },
    region: { id },
  };
}

export interface ExpandToggleProps {
  // What the button says while the region is closed ("View email") and while open ("Hide email").
  label: ReactNode;
  openLabel?: ReactNode;
  open: boolean;
  onToggle: () => void;
  // The id of the region it shows or hides.
  controls: string;
  className?: string;
}

// A link-like button with a chevron that shows or hides one region (a step's email preview).
export function ExpandToggle({
  label,
  openLabel,
  open,
  onToggle,
  controls,
  className,
}: ExpandToggleProps) {
  return (
    <button
      type="button"
      className={
        className ? `cap-link-btn cap-expand-toggle ${className}` : "cap-link-btn cap-expand-toggle"
      }
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      <span className="cap-expand-label">{open ? (openLabel ?? label) : label}</span>
    </button>
  );
}

export interface ExpandRowsProps {
  // The row's cells. Put `toggle` (the button) in the first cell.
  row: (toggle: ReactNode) => ReactNode;
  // What the button names ("customer.subscription.updated"); a hidden " details" follows it
  // unless `toggleSuffix` says otherwise ("payload").
  name: ReactNode;
  toggleSuffix?: string;
  // The detail, across every column of the table.
  detail: ReactNode;
  columns: number;
  defaultOpen?: boolean;
}

// A table row whose first cell opens a detail row under it, across the whole table (a webhook
// event and its payload). The detail row is rendered only while open: a reflowed table draws rows
// as grids, and a hidden grid row would still take its place.
export function ExpandRows({
  row,
  name,
  toggleSuffix = "details",
  detail,
  columns,
  defaultOpen = false,
}: ExpandRowsProps) {
  const { open, toggle, region } = useExpand(defaultOpen);
  const button = (
    <button type="button" className="cap-link-btn cap-expand-toggle cap-expand-row" {...toggle}>
      <span className="cap-expand-label">{name}</span>
      <span className="cap-sr-only"> {toggleSuffix}</span>
    </button>
  );
  return (
    <>
      <tr>{row(button)}</tr>
      {open ? (
        <tr className="cap-expand-detail" id={region.id}>
          <td colSpan={columns}>{detail}</td>
        </tr>
      ) : null}
    </>
  );
}
