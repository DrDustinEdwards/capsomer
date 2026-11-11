// Mounts the account settings specimens. Every element with data-mount="<state>" gets that state.
// The client is a stand-in that refuses every change as a stale sign-in would not (so no specimen
// leaves the page): each press shows the part's refusal.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Field } from "../field/field.react.tsx";
import {
  AccountSettings,
  PasskeyOffer,
  type AccountClient,
  type AccountSettingsProps,
} from "./sign-in-settings.react.tsx";

const refused = async () => ({ error: { code: "SAMPLE_REFUSED" } });
const client: AccountClient = {
  passkey: { addPasskey: refused, deletePasskey: refused, updatePasskey: refused },
  linkSocial: refused,
  unlinkAccount: refused,
  revokeOtherSessions: refused,
};

const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * 60_000);

const passkeys = [
  {
    id: "pk1",
    credentialId: "Y3JlZC0x",
    name: "Work laptop",
    provider: "iCloud Keychain",
    createdAt: ago(60 * 24 * 40),
    lastUsedAt: ago(30),
  },
  {
    id: "pk2",
    credentialId: "Y3JlZC0y",
    name: "Google Password Manager",
    provider: "Google Password Manager",
    createdAt: ago(60 * 24 * 3),
    lastUsedAt: null,
  },
];

const devices = [
  {
    id: "s1",
    device: "Firefox on macOS",
    signedInAt: ago(60 * 24 * 2),
    lastActiveAt: ago(1),
    current: true,
    location: "Austin, Texas",
  },
  {
    id: "s2",
    device: "Safari on iPhone",
    signedInAt: ago(60 * 24 * 9),
    lastActiveAt: ago(60 * 5),
    current: false,
    location: "Dallas, Texas",
  },
];

const history = [
  {
    kind: "sign-in",
    via: "passkey",
    at: ago(30),
    device: "Firefox on macOS",
    location: "Austin, Texas",
  },
  {
    kind: "sign-in-linked",
    via: "google",
    at: ago(60 * 24),
    device: "Firefox on macOS",
    location: null,
  },
  {
    kind: "passkey-added",
    via: null,
    at: ago(60 * 24 * 3),
    device: "Safari on iPhone",
    location: "Dallas, Texas",
  },
];

const base: AccountSettingsProps = {
  email: "reader@example.com",
  client,
  passkeys,
  providers: [
    { id: "google", accountId: "acc-google" },
    { id: "apple", accountId: null },
  ],
  devices,
  history,
  fresh: true,
  state: null,
  signalAs: null,
  callbackURL: "#settings",
  signInAgainHref: "#sign-in-again",
  revalidate: () => {},
  deletion: {
    consequence:
      "This deletes your account, its passkeys and its signed-in devices. It cannot be undone. You can make a new account later with any email address.",
  },
};

const SPECIMENS: Record<string, () => ReactNode> = {
  full: () => <AccountSettings {...base} />,
  new: () => (
    <AccountSettings
      {...base}
      passkeys={[]}
      providers={[]}
      devices={devices.slice(0, 1)}
      history={[]}
    />
  ),
  one: () => <AccountSettings {...base} passkeys={passkeys.slice(0, 1)} providers={[]} />,
  sent: () => (
    <AccountSettings
      {...base}
      state={{
        intent: "change-email",
        ok: true,
        error: null,
        stale: false,
        sentTo: "reader@example.com",
      }}
    />
  ),
  refused: () => (
    <AccountSettings
      {...base}
      state={{
        intent: "change-email",
        ok: false,
        error: "Use a real email address. Disposable email addresses are not allowed.",
        stale: false,
        sentTo: null,
      }}
    />
  ),
  stale: () => <AccountSettings {...base} devices={null} fresh={false} />,
  blocked: () => (
    <AccountSettings
      {...base}
      deletion={{
        consequence: base.deletion.consequence,
        blockers: (
          <>
            Your account holds a role in a Meeting (admin, chair or reviewer).{" "}
            <a href="#contact">Contact the branch</a> to hand it over, then you can delete your
            account here.
          </>
        ),
      }}
    />
  ),
  handover: () => (
    <AccountSettings
      {...base}
      deletion={{
        consequence: base.deletion.consequence,
        fields: (
          <Field label="Who takes over Mystery Readers">
            <select className="cap-select" name="successor:club1" defaultValue="u2">
              <option value="u2">Avery Lane (moderator)</option>
              <option value="">Nobody: delete the club and all its posts</option>
            </select>
          </Field>
        ),
      }}
    />
  ),
  "read-only": () => (
    <AccountSettings {...base} readOnly="This is the demo. Changes are not saved." />
  ),
  offer: () => <PasskeyOffer client={client} next="#home" siteName="Field Notes" />,
};

for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-mount]"))) {
  const render = SPECIMENS[el.dataset.mount ?? ""];
  if (render) createRoot(el).render(<StrictMode>{render()}</StrictMode>);
}
