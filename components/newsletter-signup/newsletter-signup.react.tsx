import { useId, type ReactNode } from "react";

// Only the props the sign-up passes to `renderForm`, so React Router's Form (whose method and
// encType are unions, not strings) takes them spread without a cast.
export interface NewsletterFormProps {
  className: string;
  method: "post";
  action?: string;
  "aria-labelledby": string;
  children: ReactNode;
}

export type NewsletterState = { ok: true } | { ok: false; error: string } | undefined;

export interface NewsletterSignupProps {
  // Where the form posts: the site's action, which sends the confirmation link (double opt-in).
  action?: string;
  title?: ReactNode;
  text?: ReactNode;
  // The consent line, a required checkbox (a link to the privacy page inside it).
  consent?: ReactNode;
  // The action's answer: sent, or the error to show.
  state?: NewsletterState;
  done?: ReactNode;
  button?: ReactNode;
  placeholder?: string;
  // Card (default) or on the page's own ground.
  plain?: boolean;
  headingLevel?: "h2" | "h3";
  // Draw the form with the app's router form (React Router's Form), so the post needs no reload.
  renderForm?: (props: NewsletterFormProps) => ReactNode;
}

// The HTML contract in newsletter-signup.md.
export function NewsletterSignup({
  action,
  title = "Newsletter",
  text,
  consent,
  state,
  done = "Almost done: check your inbox for a link to confirm your subscription.",
  button = "Subscribe",
  placeholder = "you@example.com",
  plain,
  headingLevel: H = "h2",
  renderForm,
}: NewsletterSignupProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const errorId = `${id}-error`;
  const failed = state && !state.ok ? state.error : undefined;
  const fields = (
    <>
      <div className="cap-newsletter-row">
        <label className="cap-sr-only" htmlFor={`${id}-email`}>
          Email address
        </label>
        <input
          id={`${id}-email`}
          className="cap-input"
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder={placeholder}
          aria-invalid={failed ? "true" : undefined}
          aria-describedby={failed ? errorId : undefined}
        />
        <button type="submit" className="cap-btn" data-variant="primary">
          {button}
        </button>
      </div>
      {consent ? (
        <label className="cap-check cap-newsletter-consent">
          <input type="checkbox" name="consent" required />
          <span>{consent}</span>
        </label>
      ) : null}
    </>
  );
  const formProps: Omit<NewsletterFormProps, "children"> = {
    className: "cap-newsletter-form",
    method: "post",
    action,
    "aria-labelledby": titleId,
  };
  return (
    <section
      className="cap-newsletter"
      data-variant={plain ? "plain" : undefined}
      aria-labelledby={titleId}
    >
      <H className="cap-newsletter-title" id={titleId}>
        {title}
      </H>
      {text ? <p className="cap-newsletter-text">{text}</p> : null}
      {state?.ok ? (
        <p className="cap-newsletter-done" role="status">
          {done}
        </p>
      ) : renderForm ? (
        renderForm({ ...formProps, children: fields })
      ) : (
        <form {...formProps}>{fields}</form>
      )}
      {failed ? (
        <p className="cap-newsletter-error" id={errorId} role="alert">
          {failed}
        </p>
      ) : null}
    </section>
  );
}
