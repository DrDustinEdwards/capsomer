import type { ComponentType, FormHTMLAttributes, ReactNode } from "react";
import { Alert } from "../banner/banner.react.tsx";
import { Button } from "../button/button.react.tsx";

// What an app asking for access may do, or may not: one line each, a check or a cross beside it.
export interface PermissionListProps {
  id: string;
  heading: ReactNode;
  items: readonly ReactNode[];
  // A list of what is allowed (checks) or of what is not (crosses).
  allowed: boolean;
}

export function PermissionList({ id, heading, items, allowed }: PermissionListProps) {
  return (
    <div className="cap-permissions" data-allowed={allowed ? "" : undefined}>
      <p className="cap-eyebrow cap-permissions-heading" data-variant="mono" id={id}>
        {heading}
      </p>
      <ul className="cap-permissions-list" aria-labelledby={id}>
        {items.map((item, i) => (
          <li key={i}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d={allowed ? "M3.5 8.5l3 3 6-7" : "M4.5 4.5l7 7M11.5 4.5l-7 7"} />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {/* The glyph is hidden: the heading says which list this is. */}
    </div>
  );
}

type FormLike = ComponentType<FormHTMLAttributes<HTMLFormElement> & { children?: ReactNode }>;

export interface ConsentScreenProps {
  // The app asking: "Example Assistant".
  client: string;
  // The site's name: "Example Co".
  product: string;
  // A client vouched for by a host that publishes its metadata names that host; a client that
  // registered itself has only its own claim to its name, and the screen says so.
  publishedBy?: string | null;
  // Where the access will be sent: the redirect's host.
  redirectHost: string;
  // A redirect that is not the client's own (a localhost loopback, a host unlike the name).
  redirectWarning?: ReactNode;
  account: { name: ReactNode; email?: ReactNode };
  // What it can do once allowed.
  can: readonly ReactNode[];
  // The write grant, a separate choice: what it adds, its scope name, ticked by default when asked.
  write?: { items: readonly ReactNode[]; scope?: string; defaultChecked?: boolean; name?: string };
  // The last post's refusal.
  error?: ReactNode;
  // The OAuth request, carried through the post.
  hidden: Record<string, string | undefined>;
  // Which button the person pressed, while the post is under way.
  submitting?: "allow" | "deny" | null;
  // The site's mark or wordmark at the top.
  brand?: ReactNode;
  // A last line: "Example Co never shares your payment provider's token with other apps."
  footnote?: ReactNode;
  // The router's form (React Router's Form), for its pending state. Default a plain form.
  Form?: FormLike;
}

const PlainForm: FormLike = (props) => <form {...props} />;

// The OAuth consent screen every site shows an app asking for access: who is asking and how far
// that is checked, where the access goes, the account, what it can do, the write grant as its own
// choice, then Allow and Deny. site-runtime's MCP login page draws the same screen as HTML.
export function ConsentScreen({
  client,
  product,
  publishedBy,
  redirectHost,
  redirectWarning,
  account,
  can,
  write,
  error,
  hidden,
  submitting,
  brand,
  footnote,
  Form = PlainForm,
}: ConsentScreenProps) {
  return (
    <main id="main" tabIndex={-1} className="cap-consent">
      <section className="cap-panel">
        <div className="cap-consent-body">
          {brand ? <div className="cap-consent-brand">{brand}</div> : null}
          <h1 className="cap-consent-title">
            {client} wants to connect to your {product} account
          </h1>
          <p className="cap-consent-text">
            Approving grants access to the account below. You can revoke it any time from Settings.
          </p>
          <p className="cap-consent-text">
            {publishedBy ? (
              <>
                Published by <strong>{publishedBy}</strong>.
              </>
            ) : (
              "This app registered itself, so its name is its own claim, not checked."
            )}{" "}
            Its access will be sent to <strong>{redirectHost}</strong>.
          </p>
          {redirectWarning ? <Alert tone="warn">{redirectWarning}</Alert> : null}
          <div className="cap-consent-box">
            <p className="cap-eyebrow cap-permissions-heading" data-variant="mono">
              Account
            </p>
            <p className="cap-consent-account">{account.name}</p>
            {account.email ? <p className="cap-consent-mono">{account.email}</p> : null}
          </div>
          <PermissionList
            id="cap-consent-can"
            heading={`What ${client} can do`}
            items={can}
            allowed
          />
          {error ? <Alert tone="crit">{error}</Alert> : null}
          <Form method="post" className="cap-consent-form">
            {Object.entries(hidden).map(([name, value]) =>
              value === undefined ? null : (
                <input key={name} type="hidden" name={name} value={value} />
              ),
            )}
            {write ? (
              <div className="cap-consent-box">
                <label className="cap-check">
                  <input
                    type="checkbox"
                    name={write.name ?? "allow_write"}
                    value="1"
                    defaultChecked={write.defaultChecked}
                  />
                  <span>
                    <strong>Allow changes</strong>
                    {write.items.map((item, i) => (
                      <span key={i} className="cap-consent-line">
                        {item}
                      </span>
                    ))}
                    <span className="cap-consent-line">Without this, {client} can only read.</span>
                    {write.scope ? (
                      <span className="cap-consent-line cap-consent-mono">{write.scope}</span>
                    ) : null}
                  </span>
                </label>
              </div>
            ) : null}
            <div className="cap-consent-actions">
              <Button
                type="submit"
                name="intent"
                value="allow"
                variant="primary"
                size="lg"
                pending={submitting === "allow"}
              >
                {submitting === "allow" ? "Approving..." : "Allow access"}
              </Button>
              <Button
                type="submit"
                name="intent"
                value="deny"
                size="lg"
                pending={submitting === "deny"}
              >
                Deny
              </Button>
            </div>
          </Form>
          {footnote ? <p className="cap-consent-foot">{footnote}</p> : null}
        </div>
      </section>
    </main>
  );
}

// The screen when the request cannot be shown (an unknown client, a bad redirect): its title and
// one sentence, in the same card.
export function ConsentRefusal({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="cap-consent">
      <section className="cap-panel">
        <div className="cap-consent-body">
          <h1 className="cap-consent-title">{title}</h1>
          <p className="cap-consent-text">{children}</p>
        </div>
      </section>
    </main>
  );
}
