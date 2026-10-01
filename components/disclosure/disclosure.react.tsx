import { useId, useState, type ReactNode } from "react";

export interface DisclosureProps {
  summary: ReactNode;
  children: ReactNode;
  // Sections that share a name open one at a time.
  name?: string;
  defaultOpen?: boolean;
}

// A show/hide section: native <details>, so it works before JavaScript and with none.
export function Disclosure({ summary, children, name, defaultOpen = false }: DisclosureProps) {
  return (
    <details className="cap-disclosure" name={name} open={defaultOpen || undefined}>
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
export function Group({ label, count, children, defaultExpanded = false, holdsCritical = false, headingLevel }: GroupProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultExpanded || holdsCritical);
  const expanded = open || holdsCritical;
  const Heading = headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "h4";
  const toggle = (
    <button type="button" className="cap-group-toggle" aria-expanded={expanded} aria-controls={id} onClick={() => setOpen(!expanded)}>
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
