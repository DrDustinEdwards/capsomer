import {
  type ComponentType,
  type FormHTMLAttributes,
  type ReactNode,
  type Ref,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { passkeySignIn } from "@dustinedwards/site-runtime/sign-in-passkey";
import {
  SIGN_IN_EXPIRES_IN_WORDS,
  SIGN_IN_LINK_WORDS,
  emailLinkWords,
  passkeyErrorWords,
} from "@dustinedwards/site-runtime/sign-in-words";
import { mountTurnstile } from "@dustinedwards/site-runtime/turnstile";
import { Alert, Banner } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";
import { CodeInput, EmailInput } from "../field/field.react.tsx";

// The one sign-in screen every site shows (sign-in.md), on site-runtime's sign-in
// (./sign-in-form on the server, ./sign-in-passkey and ./sign-in-words in the browser): a passkey
// first, Google and Apple where the site has them, then an emailed link with its code, Turnstile
// on the link. Each site keeps its look through its tokens, and its words for the page's title.

// The host router's form (React Router's <Form>), so a post stays in the app and its pending state
// shows; a plain <form> without one.
export type FormComponent = ComponentType<
  FormHTMLAttributes<HTMLFormElement> & { method?: "get" | "post" }
>;
const PlainForm: FormComponent = (props) => <form {...props} />;

/** Which ways in a page offers: site-runtime's signInMethods(env, { social }). */
export type SignInMethods = { google: boolean; apple: boolean; turnstileSiteKey: string | null };

/** What the page's action answered: site-runtime's signInFormAction state. */
export type SignInState = { sent: string | null; error: string | null; codeError: string | null };

/** The site's Better Auth client, for the passkey (site-runtime's passkeySignIn). */
export type PasskeyClient = Parameters<typeof passkeySignIn>[0];

/**
 * The frame every sign-in page sits in: an optional brand line, one card with the page's one
 * heading and the line under it, then a closing line of links. `layout="screen"` centers it in the
 * window, for a page with no site navigation.
 */
export function AuthCard({
  title,
  lede,
  brand,
  footer,
  layout = "inline",
  titleRef,
  children,
}: {
  title: ReactNode;
  lede?: ReactNode;
  brand?: ReactNode;
  footer?: ReactNode;
  layout?: "inline" | "screen";
  titleRef?: Ref<HTMLHeadingElement>;
  children?: ReactNode;
}) {
  return (
    <div className="cap-auth" data-layout={layout === "screen" ? "screen" : undefined}>
      {brand ? <div className="cap-auth-brand">{brand}</div> : null}
      <div className="cap-auth-card">
        <h1 className="cap-auth-title" ref={titleRef} tabIndex={-1}>
          {title}
        </h1>
        {lede ? <p className="cap-auth-lede">{lede}</p> : null}
        {children ? <div className="cap-auth-body">{children}</div> : null}
      </div>
      {footer ? <div className="cap-auth-foot">{footer}</div> : null}
    </div>
  );
}

/** The "or" between the buttons above and the email form. */
function OrRule() {
  return (
    <p className="cap-auth-or">
      <span>or</span>
    </p>
  );
}

/** Google's "G" in its four brand colors (Google's sign-in branding guidelines). */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="cap-auth-mark">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.582c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.582 9 3.582Z"
      />
    </svg>
  );
}

/** Apple's logo in the text color: Apple's guidelines allow a monochrome logo on a plain button. */
function AppleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 814 1000" className="cap-auth-mark" fill="currentColor">
      <path d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-166 41s-106-57-156-127C44 791 0 668 0 551 0 364 122 264 241 264c64 0 117 42 157 42 38 0 98-45 171-45 28 0 128 3 194 80zM564 166c30-36 51-85 51-135 0-7-1-14-2-19-48 2-106 32-140 73-27 31-53 80-53 131 0 8 1 15 2 18 3 1 9 1 14 1 43 0 98-29 128-69z" />
    </svg>
  );
}

/**
 * "Sign in with a passkey", the main way in, and the browser's saved passkeys in the email field's
 * suggestions (conditional mediation, once per page: the browser holds one pending request). A
 * canceled prompt is someone choosing another way, never an error. A passkey sign-in sets the
 * session cookie, so `landing` is a full load.
 */
function PasskeyButton({ client, landing }: { client: PasskeyClient; landing: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function tryPasskey(autoFill: boolean) {
    const refused = await passkeySignIn(client, { autoFill });
    if (!refused) {
      window.location.assign(landing);
      return;
    }
    if (!autoFill) setError(passkeyErrorWords(refused));
  }

  // An effect event reads the latest landing without running the effect again.
  const offerSaved = useEffectEvent(() => void tryPasskey(true));
  useEffect(() => {
    if (typeof PublicKeyCredential === "undefined") return;
    void PublicKeyCredential.isConditionalMediationAvailable?.().then((ok) => {
      if (ok) offerSaved();
    });
  }, []);

  return (
    <div className="cap-auth-passkey">
      <Button
        variant="primary"
        size="lg"
        pending={busy}
        onClick={() =>
          void (async () => {
            setBusy(true);
            setError(null);
            await tryPasskey(false);
            setBusy(false);
          })()
        }
      >
        Sign in with a passkey
      </Button>
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}

/** The Turnstile widget, drawn again for each `attempt`: a token is good for one check. */
function Turnstile({ siteKey, attempt }: { siteKey: string; attempt: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!box.current) return;
    return mountTurnstile(box.current, siteKey);
  }, [siteKey, attempt]);
  return <div className="cap-auth-check" ref={box} />;
}

export interface SignInProps {
  /** The page's heading and the line under it, before the mail is sent. */
  title: ReactNode;
  lede?: ReactNode;
  brand?: ReactNode;
  footer?: ReactNode;
  layout?: "inline" | "screen";
  /** A line above the ways in: "Your account was deleted." */
  notice?: ReactNode;
  /** The site's Better Auth client (`createAuthClient({ plugins: signInClientPlugins() })`). */
  client: PasskeyClient;
  methods: SignInMethods;
  /** The action's answer, or null before the form is sent. */
  state: SignInState | null;
  /** An error the page was opened with (`signInErrorWords` of its `?error=`). */
  error?: string | null;
  /** Where a passkey sign-in lands. */
  passkeyLanding: string;
  /** The page to return to, carried in every form; checked again on the server. */
  next?: string;
  /** A form is on its way. */
  pending?: boolean;
  /** Where Google and Apple start, posted to: `/auth/google`, `/auth/apple` by default. */
  socialAction?: (provider: "google" | "apple") => string;
  Form?: FormComponent;
}

/**
 * The sign-in screen. Before the mail: the passkey, Google and Apple, the "or" rule, then Email
 * with Turnstile and "Email me a sign-in link". After it: "Check your inbox", the code from the same
 * mail (the link signs in the browser that opens it, often the mail app's; the code signs in this
 * tab), and a way to send a new link.
 */
export function SignIn({
  title,
  lede,
  brand,
  footer,
  layout,
  notice,
  client,
  methods,
  state,
  error,
  passkeyLanding,
  next,
  pending = false,
  socialAction = (provider) => `/auth/${provider}`,
  Form = PlainForm,
}: SignInProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const sent = state?.sent ?? null;
  // The new screen's heading takes focus, so a screen reader hears the change.
  useEffect(() => {
    if (sent) heading.current?.focus();
  }, [sent]);
  const carried = next ? <input type="hidden" name="next" value={next} /> : null;

  if (sent) {
    return (
      <AuthCard
        title="Check your inbox"
        lede={`We sent a sign-in link and a code to ${sent}. Open the link, or type the code here. Both work once, for ${SIGN_IN_EXPIRES_IN_WORDS}.`}
        brand={brand}
        footer={footer}
        layout={layout}
        titleRef={heading}
      >
        <Form method="post" className="cap-auth-form" noValidate>
          <input type="hidden" name="intent" value="code" />
          <input type="hidden" name="email" value={sent} />
          {carried}
          <CodeInput label="Code" name="code" error={state?.codeError} announce />
          <Button type="submit" variant="primary" size="lg" pending={pending}>
            Sign in with the code
          </Button>
        </Form>
        <Form method="get" className="cap-auth-form">
          {carried}
          <Button type="submit" variant="quiet">
            Send a new link and code
          </Button>
        </Form>
      </AuthCard>
    );
  }

  const providers = (["google", "apple"] as const).filter((p) => methods[p]);
  const formError = state?.error ?? error ?? null;
  return (
    <AuthCard title={title} lede={lede} brand={brand} footer={footer} layout={layout}>
      {notice ? <Banner tone="ok">{notice}</Banner> : null}
      <PasskeyButton client={client} landing={passkeyLanding} />
      {providers.map((provider) => (
        <Form
          key={provider}
          method="post"
          action={socialAction(provider)}
          className="cap-auth-form"
        >
          {carried}
          <Button type="submit" size="lg">
            {provider === "google" ? <GoogleMark /> : <AppleMark />}
            {provider === "google" ? "Continue with Google" : "Continue with Apple"}
          </Button>
        </Form>
      ))}
      <OrRule />
      <Form method="post" className="cap-auth-form" noValidate>
        {carried}
        <EmailInput label="Email" name="email" signIn error={formError} announce />
        {methods.turnstileSiteKey ? (
          <Turnstile siteKey={methods.turnstileSiteKey} attempt={state} />
        ) : null}
        <Button type="submit" size="lg" pending={pending}>
          Email me a sign-in link
        </Button>
      </Form>
    </AuthCard>
  );
}

/** The button page an emailed link opens: a plain form that posts to the page's own URL, token and
 *  all, so a mail scanner's GET spends nothing and the browser follows Better Auth's redirect. */
function ConfirmButton({ label, limited }: { label: string; limited?: boolean }) {
  return (
    <form method="post" className="cap-auth-form">
      {limited ? <Alert>Too many tries. Wait a minute, then try again.</Alert> : null}
      <Button type="submit" variant="primary" size="lg">
        {label}
      </Button>
    </form>
  );
}

/** A full-width link styled as the card's main button. */
function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="cap-btn" data-variant="primary" data-size="lg" href={href}>
      {children}
    </a>
  );
}

type Problem = keyof typeof SIGN_IN_LINK_WORDS;

/**
 * The page the emailed sign-in link opens (site-runtime's confirmSignInLink): one button, or, after
 * a refused link, what went wrong (signInLinkProblem) and the way on.
 */
export function SignInConfirm({
  siteName,
  problem,
  limited,
  signInPath,
  continuePath = "/",
  brand,
  layout,
}: {
  siteName: string;
  problem: Problem | null;
  limited?: boolean;
  signInPath: string;
  continuePath?: string;
  brand?: ReactNode;
  layout?: "inline" | "screen";
}) {
  if (problem) {
    const words = SIGN_IN_LINK_WORDS[problem];
    return (
      <AuthCard title={words.title} lede={words.text} brand={brand} layout={layout}>
        {problem === "signed-in" ? (
          <CardLink href={continuePath}>Continue</CardLink>
        ) : (
          <CardLink href={signInPath}>Get a new link</CardLink>
        )}
      </AuthCard>
    );
  }
  return (
    <AuthCard title={`Sign in to ${siteName}`} brand={brand} layout={layout}>
      <ConfirmButton label="Sign in" limited={limited} />
    </AuthCard>
  );
}

/**
 * The page both email-change links open (site-runtime's confirmEmailLink and emailLinkResult): one
 * button, then what happened. `settings` names the page where the address is changed, and
 * `settingsPath` is its address.
 */
export function EmailConfirm({
  siteName,
  settings,
  settingsPath,
  done,
  problem,
  email,
  limited,
  brand,
  layout,
}: {
  siteName: string;
  settings: string;
  settingsPath: string;
  done: "approved" | "changed" | "verified" | null;
  problem: Exclude<
    keyof ReturnType<typeof emailLinkWords>,
    "confirm" | "approved" | "changed" | "verified"
  > | null;
  /** The new address, when the change is made and this browser is signed in to it. */
  email?: string | null;
  limited?: boolean;
  brand?: ReactNode;
  layout?: "inline" | "screen";
}) {
  const words = emailLinkWords({ siteName, settings });
  const shown = problem ? words[problem] : done ? words[done] : words.confirm;
  const text =
    done === "changed" && email ? `Your ${siteName} account email is now ${email}.` : shown.text;
  return (
    <AuthCard title={shown.title} lede={text} brand={brand} layout={layout}>
      {problem || done ? (
        <CardLink href={settingsPath}>Go to {settings}</CardLink>
      ) : (
        <ConfirmButton label="Confirm" limited={limited} />
      )}
    </AuthCard>
  );
}
