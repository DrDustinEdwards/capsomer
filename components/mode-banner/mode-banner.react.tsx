import type { ReactNode } from "react";

// The band at the top of an app's content while the app is not in its normal mode: a demo with
// sample data, or an admin viewing a customer's account read-only. The words are the network's
// one set, so every demo and every view-as says the same thing.

export type ModeBannerProps =
  | {
      mode: "demo";
      // A visitor (false) is shown the dashboard they would get; a signed-in person (true) is
      // told this is not their real account.
      signedIn?: boolean;
      // The ways out: Connect, Exit demo.
      actions?: ReactNode;
    }
  | {
      mode: "view-as";
      // Whose account is shown: "Acme Supply Co.".
      who: ReactNode;
      // Where Stop goes (back to the admin).
      stopHref: string;
    };

export const DEMO_WORDS = {
  title: "Demo with sample data",
  visitor:
    "This is how the dashboard looks once you connect. The numbers are made up, and nothing you do here is saved.",
  signedIn:
    "The numbers are made up, and nothing you do here is saved. This is not your real account.",
} as const;

export function ModeBanner(props: ModeBannerProps) {
  if (props.mode === "view-as")
    return (
      <div className="cap-mode-banner" data-mode="view-as" role="status">
        <p className="cap-mode-banner-text">
          Viewing as <strong>{props.who}</strong>, read-only.
        </p>
        <div className="cap-mode-banner-actions">
          <a className="cap-btn" data-size="sm" href={props.stopHref}>
            Stop viewing
          </a>
        </div>
      </div>
    );
  return (
    <div className="cap-mode-banner" data-mode="demo" role="status">
      <p className="cap-mode-banner-text">
        <strong>{DEMO_WORDS.title}.</strong>{" "}
        {props.signedIn ? DEMO_WORDS.signedIn : DEMO_WORDS.visitor}
      </p>
      {props.actions ? <div className="cap-mode-banner-actions">{props.actions}</div> : null}
    </div>
  );
}
