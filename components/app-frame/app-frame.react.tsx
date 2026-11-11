import type { ReactNode } from "react";

export interface AppFrameProps {
  children: ReactNode;
  // The address in the bar ("example.com/dashboard"), or the window's title for an app frame.
  address?: ReactNode;
  variant?: "browser" | "app";
  // A line at the foot ("Sample data").
  foot?: ReactNode;
  // A picture only: the frame is hidden from assistive tech, and `description` says in words what it shows.
  decorative?: boolean;
  description?: ReactNode;
}

// The HTML contract in app-frame.md.
export function AppFrame({ children, address, variant = "browser", foot, decorative, description }: AppFrameProps) {
  return (
    <>
      {decorative && description ? <p className="cap-sr-only">{description}</p> : null}
      <div
        className="cap-app-frame"
        data-variant={variant === "app" ? "app" : undefined}
        aria-hidden={decorative ? "true" : undefined}
      >
        <div className="cap-app-frame-bar">
          {variant === "browser" ? (
            <span className="cap-app-frame-dots" aria-hidden="true">
              <span />
            </span>
          ) : null}
          {address ? <span className="cap-app-frame-address">{address}</span> : null}
        </div>
        <div className="cap-app-frame-body">{children}</div>
        {foot ? <div className="cap-app-frame-foot">{foot}</div> : null}
      </div>
    </>
  );
}
