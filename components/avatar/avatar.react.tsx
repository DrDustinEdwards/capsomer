import { useState, type ReactNode } from "react";
import { initials } from "./avatar.ts";

export interface AvatarProps {
  // The person, agent or source. Always given: it names the avatar for a screen reader
  // when the picture or the initials stand alone.
  name: string;
  // A picture; the initials show when there is none or it fails to load.
  src?: string;
  // Override the initials ("AI" for an agent).
  fallback?: string;
  size?: "sm" | "default" | "lg";
  shape?: "circle" | "square";
  // "ai" sets the initials in the mono face.
  kind?: "person" | "ai";
  // A corner badge: a glyph, or a letter, never colour alone. Give it a `badgeLabel`.
  badge?: ReactNode;
  badgeLabel?: string;
  badgeTone?: "ok" | "crit" | "nodata";
}

export function Avatar({ name, src, fallback, size = "default", shape = "circle", kind = "person", badge, badgeLabel, badgeTone }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="cap-avatar" role="img" aria-label={badge != null && badgeLabel ? `${name}, ${badgeLabel}` : name} data-size={size === "default" ? undefined : size} data-shape={shape === "square" ? "square" : undefined} data-kind={kind === "ai" ? "ai" : undefined} data-state={failed ? "error" : undefined}>
      <span className="cap-avatar-fallback" aria-hidden="true">
        {fallback ?? initials(name)}
      </span>
      {src && !failed ? <img className="cap-avatar-image" src={src} alt="" onError={() => setFailed(true)} /> : null}
      {badge != null ? (
        <span className="cap-avatar-badge" data-tone={badgeTone} aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </span>
  );
}

export function AvatarGroup({ label, children, extra }: { label: string; children: ReactNode; extra?: number }) {
  return (
    <span className="cap-avatar-group" role="group" aria-label={label}>
      {children}
      {extra ? (
        <span className="cap-avatar-count" role="img" aria-label={`and ${extra} more`}>
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
