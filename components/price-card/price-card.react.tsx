import type { ReactNode } from "react";

export interface PriceCardProps {
  name: ReactNode;
  // The amount as it should read ("$0.07", "15%", "Free").
  price: ReactNode;
  // What the price is per, beside it ("/ word", "of recovered revenue").
  unit?: ReactNode;
  // A line under the price (a turnaround, "billed monthly").
  label?: ReactNode;
  text?: ReactNode;
  points?: ReactNode[];
  // The call to action: a ButtonLink, a Link.
  action?: ReactNode;
  // A mark above the name ("Most chosen"): a pill.
  flag?: ReactNode;
  featured?: boolean;
  id?: string;
  headingLevel?: "h2" | "h3" | "h4";
}

// The HTML contract in price-card.md.
export function PriceCard({
  name,
  price,
  unit,
  label,
  text,
  points,
  action,
  flag,
  featured,
  id,
  headingLevel: H = "h3",
}: PriceCardProps) {
  return (
    <li className="cap-price-card" id={id} data-featured={featured ? "" : undefined}>
      {flag ? <span className="cap-price-card-flag">{flag}</span> : null}
      <H className="cap-price-card-name">{name}</H>
      <p className="cap-price-card-price">
        <span className="cap-price-card-amount">{price}</span>
        {unit ? <span className="cap-price-card-unit">{unit}</span> : null}
      </p>
      {label ? <p className="cap-price-card-label">{label}</p> : null}
      {text ? <p className="cap-price-card-text">{text}</p> : null}
      {points?.length ? (
        <ul className="cap-price-card-points" aria-label="Included">
          {points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      ) : null}
      {action ? <div className="cap-price-card-action">{action}</div> : null}
    </li>
  );
}

export function PriceGrid({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul className="cap-price-grid" aria-label={label}>
      {children}
    </ul>
  );
}

export interface PlanOption {
  value: string;
  name: ReactNode;
  price?: ReactNode;
  disabled?: boolean;
}

export interface PlanChoiceProps {
  // The radio group's name, posted with the form.
  name: string;
  legend: ReactNode;
  options: PlanOption[];
  // Uncontrolled: the plan chosen at first.
  defaultValue?: string;
  // Controlled: the chosen plan, and what to do when it changes.
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

export function PlanChoice({
  name,
  legend,
  options,
  defaultValue,
  value,
  onChange,
  required,
}: PlanChoiceProps) {
  return (
    <fieldset className="cap-plan-choice">
      <legend>{legend}</legend>
      <div className="cap-plan-choice-options">
        {options.map((o) => (
          <label className="cap-plan-option" key={o.value}>
            <input
              type="radio"
              name={name}
              value={o.value}
              disabled={o.disabled}
              required={required}
              {...(value !== undefined
                ? { checked: value === o.value, onChange: () => onChange?.(o.value) }
                : { defaultChecked: defaultValue === o.value })}
            />
            <span className="cap-plan-option-name">{o.name}</span>
            {o.price ? <span className="cap-plan-option-price">{o.price}</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
