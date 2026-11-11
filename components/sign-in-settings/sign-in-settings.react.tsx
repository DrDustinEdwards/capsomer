import { type ComponentType, type ReactNode, useEffect, useState } from "react";
import {
  canOfferPasskey,
  signalPasskeys,
  signalUnknownCredential,
} from "@dustinedwards/site-runtime/sign-in-passkey";
import { ACCOUNT_WORDS, securityHistoryWords } from "@dustinedwards/site-runtime/sign-in-words";
import { Alert, Banner } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";
import { Check, EmailInput, Field } from "../field/field.react.tsx";
import { Panel } from "../panel/panel.react.tsx";
import { AuthCard } from "../sign-in/sign-in.react.tsx";
import { Time } from "../time/time.react.tsx";

// How a signed-in person manages their account (sign-in-settings.md), the same on every site, on
// site-runtime's sign-in: the email address, passkeys, Google and Apple, signed-in devices, recent
// security activity and deleting the account; and the passkey offer after an email sign-in. Posts
// that change the account on the server go to the page's own action (site-runtime's
// accountFormAction); the passkey, Google and Apple, and signing out every other device are Better
// Auth's own client calls, since WebAuthn and the providers run in the browser.

/** The host router's form (React Router's <Form>), so a post stays in the app; a plain form without one. */
// Only the props these pages pass, so React Router's <Form> (whose encType is a union) fits.
export type FormComponent = ComponentType<{
  method?: "get" | "post";
  action?: string;
  className?: string;
  noValidate?: boolean;
  children?: ReactNode;
}>;
const PlainForm: FormComponent = (props) => <form {...props} />;

type ClientAnswer = Promise<{ error?: unknown } | null | undefined>;

/** The site's Better Auth client (`createAuthClient({ plugins: signInClientPlugins() })`), the calls this page makes. */
export type AccountClient = {
  passkey: {
    addPasskey(options?: Record<string, unknown>): ClientAnswer;
    deletePasskey(input: { id: string }): ClientAnswer;
    updatePasskey(input: { id: string; name: string }): ClientAnswer;
  };
  linkSocial(input: { provider: "google" | "apple"; callbackURL: string }): ClientAnswer;
  unlinkAccount(input: { accountId: string; providerId?: string }): ClientAnswer;
  revokeOtherSessions(): ClientAnswer;
};

/** site-runtime's accountFormAction state. */
export type AccountState = {
  intent: string;
  ok: boolean;
  error: string | null;
  stale: boolean;
  sentTo: string | null;
};

type When = Date | string | number;

/** One passkey: site-runtime's passkeyRows, with the credential id for the browser's signals. */
export type PasskeyRow = {
  id: string;
  credentialId: string | null;
  name: string;
  provider: string;
  createdAt: When | null;
  lastUsedAt: When | null;
};

/** One signed-in device: site-runtime's sessionRows (accountSessions). */
export type DeviceRow = {
  id: string;
  device: string | null;
  signedInAt: When;
  lastActiveAt: When;
  current: boolean;
  location: string | null;
};

/** One history row: site-runtime's securityHistory. */
export type HistoryRow = {
  kind: string;
  via: string | null;
  at: When;
  device: string | null;
  location: string | null;
};

export type ProviderRow = { id: "google" | "apple"; accountId: string | null };

const PROVIDER_NAME = { google: "Google", apple: "Apple" } as const;

/** Better Auth's refusal for want of a recent sign-in. */
function isStale(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "SESSION_NOT_FRESH" || code === "SESSION_EXPIRED";
}

/**
 * One browser-side change at a time (a press while one runs does nothing; Capsomer's buttons are
 * never disabled), keyed for its button's pending state. A stale sign-in goes to `signInAgainHref`;
 * a refusal shows `failed`; success asks the page to load its data again.
 */
function useClientChange({
  signInAgainHref,
  revalidate,
  readOnly,
}: {
  signInAgainHref: string;
  revalidate: () => unknown;
  readOnly?: string | null;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function run(
    key: string,
    change: () => ClientAnswer,
    failed: string,
    after?: () => unknown,
  ) {
    if (busy !== null) return;
    setError(null);
    if (readOnly) {
      setError(readOnly);
      return;
    }
    setBusy(key);
    try {
      const res = await change();
      if (isStale(res?.error)) {
        window.location.assign(signInAgainHref);
        return;
      }
      if (res?.error) {
        setError(failed);
        return;
      }
      await after?.();
      await revalidate();
    } catch {
      setError(ACCOUNT_WORDS.offline);
    } finally {
      setBusy(null);
    }
  }
  return { busy, error, run };
}

/** "Sign in again", a link to the sign-in page that returns here. */
function SignInAgain({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Alert
      tone="warn"
      action={
        <a className="cap-btn" data-size="sm" href={href}>
          Sign in again
        </a>
      }
    >
      {children}
    </Alert>
  );
}

const mine = (state: AccountState | null | undefined, intent: string) =>
  state?.intent === intent ? state : null;

/**
 * The email address: where sign-in links go, and the change, which the current address approves
 * first and the new one confirms (site-runtime's accountOptions). A post to the page's action.
 */
export function EmailSettings({
  email,
  state,
  pending,
  readOnly,
  signInAgainHref,
  Form = PlainForm,
}: {
  email: string;
  state?: AccountState | null;
  pending?: boolean;
  readOnly?: string | null;
  signInAgainHref: string;
  Form?: FormComponent;
}) {
  const answer = mine(state, "change-email");
  return (
    <Panel
      title="Email address"
      description={
        <>
          Sign-in links go to <strong>{email}</strong>. To change it, approve the change from this
          address, then confirm it from the new one. Your other devices are then signed out.
        </>
      }
    >
      <div className="cap-account-stack">
        {answer?.ok && answer.sentTo ? (
          <Banner tone="ok">{ACCOUNT_WORDS.emailSent(answer.sentTo)}</Banner>
        ) : null}
        {answer?.stale ? (
          <SignInAgain href={signInAgainHref}>{answer.error}</SignInAgain>
        ) : readOnly ? null : (
          <Form method="post" className="cap-account-form" noValidate>
            <input type="hidden" name="intent" value="change-email" />
            <EmailInput
              label="New email address"
              name="newEmail"
              required
              error={answer && !answer.ok ? answer.error : null}
              announce
            />
            <div>
              <Button type="submit" pending={pending}>
                Change email
              </Button>
            </div>
          </Form>
        )}
      </div>
    </Panel>
  );
}

/** One passkey: its name, its provider when the name is not that, when it was added and last used. */
function PasskeyItem({
  passkey,
  busy,
  onRename,
  onRemove,
}: {
  passkey: PasskeyRow;
  busy: string | null;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  if (renaming)
    return (
      <li>
        <form
          className="cap-account-row"
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(new FormData(event.currentTarget).get("name") ?? "").trim();
            setRenaming(false);
            if (name && name !== passkey.name) onRename(name);
          }}
        >
          <Field label={`New name for ${passkey.name}`}>
            <input
              className="cap-input"
              name="name"
              defaultValue={passkey.name}
              maxLength={60}
              autoComplete="off"
              required
              // oxlint-disable-next-line jsx-a11y/no-autofocus -- the field opens on the person's own press of Rename
              autoFocus
            />
          </Field>
          <span className="cap-account-actions">
            <Button type="submit" size="sm" variant="primary">
              Save
            </Button>
            <Button size="sm" variant="quiet" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
          </span>
        </form>
      </li>
    );
  return (
    <li className="cap-account-row">
      <span className="cap-account-what">
        {passkey.name}
        <span className="cap-account-meta">
          {passkey.provider !== passkey.name ? `${passkey.provider}, ` : null}
          {passkey.createdAt ? (
            <>
              added <Time at={passkey.createdAt} />,{" "}
            </>
          ) : null}
          {passkey.lastUsedAt ? (
            <>
              last used <Time at={passkey.lastUsedAt} />
            </>
          ) : (
            "not used to sign in yet"
          )}
        </span>
      </span>
      <span className="cap-account-actions">
        <Button
          size="sm"
          pending={busy === `rename-${passkey.id}`}
          onClick={() => setRenaming(true)}
        >
          Rename<span className="cap-sr-only"> {passkey.name}</span>
        </Button>
        <Button size="sm" pending={busy === `remove-${passkey.id}`} onClick={onRemove}>
          Remove<span className="cap-sr-only"> {passkey.name}</span>
        </Button>
      </span>
    </li>
  );
}

/**
 * The passkeys: each renamed or removed in place, and one added. A second is suggested while there
 * is only one. Each time the list loads, the browser's passkey provider hears which ones the site
 * still accepts and the account's address (the WebAuthn Signal API), so one removed elsewhere stops
 * being offered.
 */
export function PasskeySettings({
  client,
  passkeys,
  signalAs,
  rpId,
  readOnly,
  signInAgainHref,
  revalidate,
}: {
  client: AccountClient;
  passkeys: PasskeyRow[];
  /** The address and name the provider shows; null where the page is not the person's own. */
  signalAs: { name: string; displayName?: string } | null;
  /** The relying party (the site's host); the page's host by default. */
  rpId?: string;
  readOnly?: string | null;
  signInAgainHref: string;
  revalidate: () => unknown;
}) {
  const { busy, error, run } = useClientChange({ signInAgainHref, revalidate, readOnly });
  const ids = passkeys.map((p) => p.credentialId ?? "").join(" ");
  const name = signalAs?.name ?? null;
  const displayName = signalAs?.displayName;
  useEffect(() => {
    if (!name) return;
    const credentialIds = ids.split(" ");
    // A passkey without its id would be dropped from the provider's list, so a gap sends nothing.
    if (credentialIds.some((id) => !id) && ids !== "") return;
    void signalPasskeys({ rpId, credentialIds: ids ? credentialIds : [], name, displayName });
  }, [ids, name, displayName, rpId]);

  return (
    <Panel
      title="Passkeys"
      description="A passkey signs you in with your face, fingerprint or device PIN, and only works on this site, so it cannot be phished. You can always sign in with an email link too."
    >
      <div className="cap-account-stack">
        {passkeys.length === 0 ? (
          <p className="cap-account-meta">No passkeys yet.</p>
        ) : (
          <ul className="cap-account-list" aria-label="Your passkeys">
            {passkeys.map((p) => (
              <PasskeyItem
                key={p.id}
                passkey={p}
                busy={busy}
                onRename={(next) =>
                  void run(
                    `rename-${p.id}`,
                    () => client.passkey.updatePasskey({ id: p.id, name: next }),
                    ACCOUNT_WORDS.passkeyRenameFailed,
                  )
                }
                onRemove={() =>
                  void run(
                    `remove-${p.id}`,
                    () => client.passkey.deletePasskey({ id: p.id }),
                    ACCOUNT_WORDS.passkeyRemoveFailed,
                    () =>
                      p.credentialId
                        ? signalUnknownCredential({
                            rpId: rpId ?? location.hostname,
                            credentialId: p.credentialId,
                          })
                        : undefined,
                  )
                }
              />
            ))}
          </ul>
        )}
        {passkeys.length === 1 ? (
          <Alert tone="info" title="Add a second passkey">
            Your only passkey is on one device. Add one on another device too, such as your phone or
            a security key, so losing this one never leaves you waiting on an email.
          </Alert>
        ) : null}
        <div>
          <Button
            variant="primary"
            pending={busy === "add"}
            onClick={() =>
              void run("add", () => client.passkey.addPasskey(), ACCOUNT_WORDS.passkeyAddFailed)
            }
          >
            {busy === "add"
              ? "Waiting for your device..."
              : passkeys.length > 0
                ? "Add another passkey"
                : "Create a passkey"}
          </Button>
        </div>
        {error ? <Alert>{error}</Alert> : null}
      </div>
    </Panel>
  );
}

/**
 * Google and Apple joined to the account. Joining happens only here, while signed in, never by a
 * matching email at sign-in; the email link always works, so nothing here can lock anyone out.
 */
export function ProviderSettings({
  client,
  providers,
  callbackURL,
  readOnly,
  signInAgainHref,
  revalidate,
}: {
  client: AccountClient;
  providers: ProviderRow[];
  /** Where the provider returns: this page. */
  callbackURL: string;
  readOnly?: string | null;
  signInAgainHref: string;
  revalidate: () => unknown;
}) {
  const { busy, error, run } = useClientChange({ signInAgainHref, revalidate, readOnly });
  if (providers.length === 0) return null;
  return (
    <Panel
      title="Google and Apple"
      description="Sign in with Google or Apple once you connect it here."
    >
      <div className="cap-account-stack">
        <ul className="cap-account-list">
          {providers.map((provider) => {
            const label = PROVIDER_NAME[provider.id];
            return (
              <li key={provider.id} className="cap-account-row">
                <span className="cap-account-what">
                  {label}
                  <span className="cap-account-meta">
                    {provider.accountId ? "Connected" : "Not connected"}
                  </span>
                </span>
                <span className="cap-account-actions">
                  {provider.accountId ? (
                    <Button
                      size="sm"
                      pending={busy === provider.id}
                      onClick={() =>
                        void run(
                          provider.id,
                          () =>
                            client.unlinkAccount({
                              accountId: provider.accountId ?? "",
                              providerId: provider.id,
                            }),
                          ACCOUNT_WORDS.unlinkFailed(label),
                        )
                      }
                    >
                      Disconnect<span className="cap-sr-only"> {label}</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      pending={busy === provider.id}
                      onClick={() =>
                        void run(
                          provider.id,
                          () => client.linkSocial({ provider: provider.id, callbackURL }),
                          ACCOUNT_WORDS.linkFailed(label),
                        )
                      }
                    >
                      Connect<span className="cap-sr-only"> {label}</span>
                    </Button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {error ? <Alert>{error}</Alert> : null}
      </div>
    </Panel>
  );
}

/**
 * Where the person is signed in, this device first. Each other device signs out by a post of its
 * session id (no token reaches the page); "Sign out all other devices" is Better Auth's own call.
 * `devices` is null when listing them needs a recent sign-in.
 */
export function DeviceSettings({
  client,
  devices,
  state,
  pendingSession,
  readOnly,
  signInAgainHref,
  revalidate,
  Form = PlainForm,
}: {
  client: AccountClient;
  devices: DeviceRow[] | null;
  state?: AccountState | null;
  /** The session id whose sign-out post is on its way. */
  pendingSession?: string | null;
  readOnly?: string | null;
  signInAgainHref: string;
  revalidate: () => unknown;
  Form?: FormComponent;
}) {
  const { busy, error, run } = useClientChange({ signInAgainHref, revalidate, readOnly });
  const answer = mine(state, "sign-out-device");
  const description =
    "Where you are signed in. Sign out of a device you do not know, or one you no longer use.";
  if (devices === null || answer?.stale)
    return (
      <Panel title="Signed-in devices" description={description}>
        <SignInAgain href={signInAgainHref}>{ACCOUNT_WORDS.stale["sign-out-device"]}</SignInAgain>
      </Panel>
    );
  return (
    <Panel title="Signed-in devices" description={description}>
      <div className="cap-account-stack">
        <ul className="cap-account-list" aria-label="Your signed-in devices">
          {devices.map((d) => {
            const name = d.device ?? "Unknown device";
            return (
              <li key={d.id} className="cap-account-row">
                <span className="cap-account-what">
                  {name}
                  {d.current ? " (this device)" : null}
                  <span className="cap-account-meta">
                    Signed in <Time at={d.signedInAt} />
                    {d.location ? ` near ${d.location}` : null}, last active{" "}
                    <Time at={d.lastActiveAt} />
                  </span>
                </span>
                {d.current || readOnly ? null : (
                  <Form method="post" className="cap-account-actions">
                    <input type="hidden" name="intent" value="sign-out-device" />
                    <input type="hidden" name="session" value={d.id} />
                    <Button type="submit" size="sm" pending={pendingSession === d.id}>
                      Sign out<span className="cap-sr-only"> {name}</span>
                    </Button>
                  </Form>
                )}
              </li>
            );
          })}
        </ul>
        {devices.length > 1 ? (
          <div>
            <Button
              pending={busy === "others"}
              onClick={() =>
                void run("others", () => client.revokeOtherSessions(), ACCOUNT_WORDS.othersFailed)
              }
            >
              Sign out all other devices
            </Button>
          </div>
        ) : null}
        {error || (answer && !answer.ok) ? <Alert>{error ?? answer?.error}</Alert> : null}
      </div>
    </Panel>
  );
}

/** The latest sign-ins and changes to how the person signs in, newest first, in one set of words. */
export function SecurityHistory({ history }: { history: HistoryRow[] }) {
  return (
    <Panel
      title="Recent security activity"
      description="Your last sign-ins and changes to how you sign in. If you do not recognize one, sign that device out and remove any passkey you did not add."
    >
      {history.length === 0 ? (
        <p className="cap-account-meta">Nothing yet.</p>
      ) : (
        <ul className="cap-account-list" aria-label="Your recent security activity">
          {history.map((h, i) => (
            // An index key: a fixed, newest-first list that never reorders on screen.
            <li key={i} className="cap-account-what">
              {securityHistoryWords(h)}
              <span className="cap-account-meta">
                <Time at={h.at} />
                {h.device ? `, ${h.device}` : null}
                {h.location ? ` near ${h.location}` : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/**
 * Deleting the account: what it deletes and keeps (the site's words), the site's own fields (a
 * hand-over), the box to tick, then the danger button, a post to the page's action. `blockers`,
 * when given, says why it cannot be deleted yet and takes the form's place.
 */
export function DeleteAccount({
  fresh,
  consequence,
  blockers,
  fields,
  state,
  pending,
  readOnly,
  signInAgainHref,
  Form = PlainForm,
}: {
  /** The sign-in is recent enough (site-runtime's sessionIsFresh). */
  fresh: boolean;
  consequence: ReactNode;
  blockers?: ReactNode;
  fields?: ReactNode;
  state?: AccountState | null;
  pending?: boolean;
  readOnly?: string | null;
  signInAgainHref: string;
  Form?: FormComponent;
}) {
  const answer = mine(state, "delete-account");
  return (
    <Panel title="Delete your account" description={blockers ?? consequence}>
      {blockers ? null : readOnly ? (
        <p className="cap-account-meta">{readOnly}</p>
      ) : !fresh || answer?.stale ? (
        <SignInAgain href={signInAgainHref}>{ACCOUNT_WORDS.stale["delete-account"]}</SignInAgain>
      ) : (
        <Form method="post" className="cap-account-form">
          <input type="hidden" name="intent" value="delete-account" />
          {fields}
          <Check name="confirm" required label="I understand my account is deleted for good" />
          {answer && !answer.ok ? <Alert>{answer.error}</Alert> : null}
          <div>
            <Button type="submit" variant="danger" pending={pending}>
              Delete my account
            </Button>
          </div>
        </Form>
      )}
    </Panel>
  );
}

/**
 * The offer after an email link, a code, Google or Apple: make a passkey, or "Not now" (a post to
 * the page's action, site-runtime's dismissPasskeyOffer, held 30 days). A device with no built-in
 * way to make one goes straight on to `next`.
 */
export function PasskeyOffer({
  client,
  next,
  siteName,
  brand,
  layout,
  Form = PlainForm,
}: {
  client: AccountClient;
  /** Where the person was headed; checked on the server. */
  next: string;
  siteName: string;
  brand?: ReactNode;
  layout?: "inline" | "screen";
  Form?: FormComponent;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void canOfferPasskey().then((can) => {
      if (!can) window.location.replace(next);
    });
  }, [next]);
  return (
    <AuthCard
      title="You're signed in"
      lede={`Next time, skip the email. A passkey signs you in with your face, fingerprint or device PIN, and only works on ${siteName}, so it cannot be phished.`}
      brand={brand}
      layout={layout}
    >
      {error ? <Alert>{error}</Alert> : null}
      <Button
        variant="primary"
        size="lg"
        pending={busy}
        onClick={() =>
          void (async () => {
            if (busy) return;
            setBusy(true);
            setError(null);
            const res = await client.passkey.addPasskey().catch(() => ({ error: {} }));
            if (!res?.error) {
              window.location.assign(next);
              return;
            }
            setBusy(false);
            setError(ACCOUNT_WORDS.passkeyAddFailed);
          })()
        }
      >
        {busy ? "Waiting for your device..." : "Create a passkey"}
      </Button>
      <Form method="post" className="cap-auth-form">
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="quiet">
          Not now
        </Button>
      </Form>
    </AuthCard>
  );
}

export interface AccountSettingsProps {
  email: string;
  client: AccountClient;
  passkeys: PasskeyRow[];
  providers: ProviderRow[];
  devices: DeviceRow[] | null;
  history: HistoryRow[];
  fresh: boolean;
  /** The action's answer (accountFormAction's state), or null. */
  state?: AccountState | null;
  /** The intent of the post on its way, and its session for a device sign-out. */
  pending?: { intent: string; session?: string | null } | null;
  signalAs: { name: string; displayName?: string } | null;
  rpId?: string;
  /** This page, for Google's and Apple's return. */
  callbackURL: string;
  /** The sign-in page with a fresh-sign-in flag and `next` back here. */
  signInAgainHref: string;
  revalidate: () => unknown;
  deletion: { consequence: ReactNode; blockers?: ReactNode; fields?: ReactNode };
  /** A page that saves nothing (a demo): every change says this instead. */
  readOnly?: string | null;
  Form?: FormComponent;
}

/** The whole account settings, in the network's order. A site with its own layout uses the parts. */
export function AccountSettings(props: AccountSettingsProps) {
  const { pending, readOnly, signInAgainHref, revalidate, Form, client, state } = props;
  const shared = { readOnly, signInAgainHref, revalidate };
  return (
    <div className="cap-account">
      <EmailSettings
        email={props.email}
        state={state}
        pending={pending?.intent === "change-email"}
        readOnly={readOnly}
        signInAgainHref={signInAgainHref}
        Form={Form}
      />
      <PasskeySettings
        {...shared}
        client={client}
        passkeys={props.passkeys}
        signalAs={props.signalAs}
        rpId={props.rpId}
      />
      <ProviderSettings
        {...shared}
        client={client}
        providers={props.providers}
        callbackURL={props.callbackURL}
      />
      <DeviceSettings
        {...shared}
        client={client}
        devices={props.devices}
        state={state}
        pendingSession={pending?.intent === "sign-out-device" ? (pending.session ?? null) : null}
        Form={Form}
      />
      <SecurityHistory history={props.history} />
      <DeleteAccount
        {...props.deletion}
        fresh={props.fresh}
        state={state}
        pending={pending?.intent === "delete-account"}
        readOnly={readOnly}
        signInAgainHref={signInAgainHref}
        Form={Form}
      />
    </div>
  );
}
