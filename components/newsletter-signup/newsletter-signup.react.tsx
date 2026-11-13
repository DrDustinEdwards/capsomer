import { useId, useMemo, type ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { Check, TextField } from "../field/field.react.tsx";
import { FormStatus } from "../form-status/form-status.react.tsx";

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

// The HTML contract in newsletter-signup.md: the field's TextField with its button as the row's
// action and the error as the field's, the consent a Check, and the answer said by FormStatus,
// whose region is in the page from the start and takes focus when the form is replaced by it.
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
  const titleId = `${useId()}-title`;
  const failed = state && !state.ok ? state.error : undefined;
  const sent = useMemo(
    () => (state?.ok ? { ok: true as const, message: done } : null),
    [state, done],
  );
  const fields = (
    <>
      <TextField
        label="Email address"
        labelHidden
        showRequired={false}
        type="email"
        name="email"
        required
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        placeholder={placeholder}
        error={failed}
        announce
        action={
          <Button type="submit" variant="primary">
            {button}
          </Button>
        }
      />
      {consent ? (
        <Check
          className="cap-newsletter-consent"
          name="consent"
          required
          label={<span>{consent}</span>}
        />
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
      <FormStatus status={sent} />
      {sent ? null : renderForm ? (
        renderForm({ ...formProps, children: fields })
      ) : (
        <form {...formProps}>{fields}</form>
      )}
    </section>
  );
}
