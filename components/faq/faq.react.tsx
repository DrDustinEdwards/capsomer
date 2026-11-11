import type { ReactNode } from "react";

// The shape Prelum's faqPage(faqs) takes, so one list feeds the page and its FAQPage JSON-LD.
export interface FaqItem {
  question: string;
  answer: ReactNode;
  id?: string;
}

export interface FaqProps {
  items: FaqItem[];
  // "accordion": one answer open at a time (no script). "cards": the same, each a card. "list": every answer shown.
  variant?: "accordion" | "cards" | "list";
  // The shared details name; the browser keeps one of a name open. Default "faq".
  name?: string;
  // Open the first question at first (accordion and cards).
  openFirst?: boolean;
  headingLevel?: "h2" | "h3" | "h4";
}

function Answer({ answer }: { answer: ReactNode }) {
  return typeof answer === "string" ? <p>{answer}</p> : <>{answer}</>;
}

// The HTML contract in faq.md.
export function Faq({
  items,
  variant = "accordion",
  name = "faq",
  openFirst,
  headingLevel: H = "h3",
}: FaqProps) {
  if (variant === "list") {
    return (
      <ul className="cap-faq" data-variant="list">
        {items.map((item) => (
          <li key={item.id ?? item.question} id={item.id}>
            <H className="cap-faq-question">{item.question}</H>
            <div className="cap-faq-answer">
              <Answer answer={item.answer} />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="cap-faq" data-variant={variant === "cards" ? "cards" : undefined}>
      {items.map((item, i) => (
        <li key={item.id ?? item.question} id={item.id}>
          <details
            className="cap-disclosure"
            data-variant={variant === "cards" ? "card" : "accordion"}
            name={name}
            open={openFirst && i === 0 ? true : undefined}
          >
            <summary>
              <H className="cap-faq-question">{item.question}</H>
            </summary>
            <div className="cap-disclosure-body cap-faq-answer">
              <Answer answer={item.answer} />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
