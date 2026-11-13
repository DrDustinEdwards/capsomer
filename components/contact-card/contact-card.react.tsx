import { Fragment, type ReactNode } from "react";

// A phone number as a `tel:` address: the digits and a leading +, with a country code when the number has none
// (`country`, "1" for the US). RFC 3966: visual separators may stay, so dashes are kept.
export function telHref(number: string, country = "1"): string {
  const trimmed = number.trim();
  if (trimmed.startsWith("+")) return `tel:${trimmed.replace(/[^\d+-]/g, "")}`;
  return `tel:+${country}-${trimmed.replace(/[^\d-]/g, "")}`;
}

export interface ContactWay {
  label: ReactNode;
  href: string;
  icon?: ReactNode;
  // An icon after the words (an arrow).
  iconEnd?: ReactNode;
}

export interface ContactLine {
  // What the line is for ("Accounts", "Fax").
  label: ReactNode;
  // Phone numbers as written; each becomes a tel: link.
  numbers: string[];
  // A word between the numbers ("or"). Omitted: the numbers sit side by side.
  join?: string;
}

export interface ContactCardProps {
  title: ReactNode;
  headingLevel?: "h2" | "h3" | "h4";
  // A sentence over the ways.
  text?: ReactNode;
  // Links: an email, a profile, a booking page.
  ways?: ContactWay[];
  // The ways' columns in this card. Omitted: as many as fit at 12rem.
  wayColumns?: 1 | 2 | 3;
  // Labeled phone numbers.
  lines?: ContactLine[];
  // Address lines, linked to a map when `mapHref` is given.
  address?: string[];
  mapHref?: string;
  country?: string;
  children?: ReactNode;
}

// The HTML contract in contact-card.md.
export function ContactCard({
  title,
  headingLevel: H = "h3",
  text,
  ways,
  wayColumns,
  lines,
  address,
  mapHref,
  country,
  children,
}: ContactCardProps) {
  const addressLines = address?.map((line, i) => <span key={i}>{line}</span>);
  return (
    <div className="cap-contact-card">
      <H className="cap-contact-card-title">{title}</H>
      {text ? <p className="cap-contact-text">{text}</p> : null}
      {ways?.length ? (
        <ul className="cap-contact-ways" data-columns={wayColumns}>
          {ways.map((w) => (
            <li key={w.href}>
              <a className="cap-contact-way" href={w.href}>
                {w.icon ? <span aria-hidden="true">{w.icon}</span> : null}
                {w.label}
                {w.iconEnd ? <span aria-hidden="true">{w.iconEnd}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {lines?.length ? (
        <dl className="cap-contact-lines">
          {lines.map((line, i) => (
            <div key={i}>
              <dt>{line.label}</dt>
              <dd>
                {line.numbers.map((n, j) => (
                  <Fragment key={n}>
                    {j > 0 && line.join ? <span>{line.join}</span> : null}
                    <a href={telHref(n, country)}>{n}</a>
                  </Fragment>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {addressLines ? (
        mapHref ? (
          <a className="cap-contact-address" href={mapHref}>
            {addressLines}
          </a>
        ) : (
          <address className="cap-contact-address">{addressLines}</address>
        )
      ) : null}
      {children}
    </div>
  );
}

export function ContactGrid({ children, plain }: { children: ReactNode; plain?: boolean }) {
  return (
    <div className="cap-contact-grid" data-variant={plain ? "plain" : undefined}>
      {children}
    </div>
  );
}
