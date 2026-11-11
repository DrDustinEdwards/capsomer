import { useId, type ReactNode } from "react";

export interface DangerZoneProps {
  // The label over the controls.
  title?: ReactNode;
  // One line on what the controls do and keep, beside them.
  note?: ReactNode;
  // The risky controls: buttons that each preview and confirm (a confirm dialog), never act at once.
  children: ReactNode;
}

// The HTML contract in danger-zone.md.
export function DangerZone({ title = "Danger", note, children }: DangerZoneProps) {
  const id = useId();
  return (
    <div className="cap-danger" role="group" aria-labelledby={id}>
      <p className="cap-danger-title" id={id}>
        {title}
      </p>
      <div className="cap-danger-actions">
        {children}
        {note ? <span className="cap-danger-note">{note}</span> : null}
      </div>
    </div>
  );
}
