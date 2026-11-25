import type { ReactNode } from "react";

export interface RouteSplashProps {
  mark: { src: string; alt: string };
  label?: ReactNode;
}

export function RouteSplash({ mark, label = "Loading..." }: RouteSplashProps) {
  return (
    <div className="cap-route-splash" role="status">
      <img className="cap-route-splash-mark" src={mark.src} alt={mark.alt} width={96} height={96} />
      <p className="cap-route-splash-label">{label}</p>
    </div>
  );
}
