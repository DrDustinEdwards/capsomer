// Mounts the sign-in specimens. Every element with data-mount="<state>" gets that state. The
// passkey client is a stand-in: a press is refused as a passkey the site does not know, and the
// browser's autofill is canceled, so no specimen leaves the page.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { EmailConfirm, SignIn, SignInConfirm, type PasskeyClient } from "./sign-in.react.tsx";

const client: PasskeyClient = {
  signIn: {
    passkey: async (options?: Record<string, unknown>) => ({
      error: { code: options?.autoFill ? "AUTH_CANCELLED" : "PASSKEY_NOT_FOUND" },
    }),
  },
  passkey: { listUserPasskeys: async () => ({ data: [] }) },
  getSession: async () => ({ data: null }),
};

const methods = { google: false, apple: false, turnstileSiteKey: null };
const social = { ...methods, google: true, apple: true };
const base = {
  title: "Sign in",
  lede: "Use your passkey, or get a sign-in link by email. No password needed.",
  client,
  passkeyLanding: "#signed-in",
  state: null,
};
const footer = (
  <p>
    New here? <a href="#signup">Make an account</a>
  </p>
);

const SPECIMENS: Record<string, () => ReactNode> = {
  social: () => <SignIn {...base} methods={social} footer={footer} />,
  plain: () => <SignIn {...base} methods={methods} />,
  error: () => (
    <SignIn
      {...base}
      methods={methods}
      state={{
        sent: null,
        error: "Complete the check, then send the link again.",
        codeError: null,
      }}
    />
  ),
  notice: () => <SignIn {...base} methods={methods} notice="Your account was deleted." />,
  sent: () => (
    <SignIn
      {...base}
      methods={methods}
      state={{ sent: "reader@example.com", error: null, codeError: null }}
    />
  ),
  "code-error": () => (
    <SignIn
      {...base}
      methods={methods}
      state={{
        sent: "reader@example.com",
        error: null,
        codeError: "That code is not right. Check the six digits in the newest email.",
      }}
    />
  ),
  confirm: () => <SignInConfirm siteName="Field Notes" problem={null} signInPath="#sign-in" />,
  "confirm-expired": () => (
    <SignInConfirm siteName="Field Notes" problem="expired" signInPath="#sign-in" />
  ),
  "email-confirm": () => (
    <EmailConfirm
      siteName="Field Notes"
      settings="Settings"
      settingsPath="#settings"
      done={null}
      problem={null}
    />
  ),
  "email-changed": () => (
    <EmailConfirm
      siteName="Field Notes"
      settings="Settings"
      settingsPath="#settings"
      done="changed"
      problem={null}
      email="new@example.com"
    />
  ),
  screen: () => (
    <SignIn
      {...base}
      layout="screen"
      methods={social}
      brand={<strong>Field Notes</strong>}
      footer={footer}
    />
  ),
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
