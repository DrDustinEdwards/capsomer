// The line above a file's text in its room: who else is in it, each in the color of their caret,
// whether this page is connected, and for someone who may edit, Editing or Suggesting.

import { Avatar, AvatarGroup } from "../avatar/avatar.react.tsx";
import { Segmented } from "../segmented/segmented.react.tsx";
import { Status } from "../status/status.react.tsx";

import type { RoomPerson } from "./collab-editor-protocol.ts";

import { personSlot, type RoomStatus } from "./collab-editor-room.ts";

export type WriteMode = "edit" | "suggest";

/** One entry per person, however many tabs they have open, without this page's own connection. */
function othersIn(people: RoomPerson[], me: number): RoomPerson[] {
  const seen = new Map<number, RoomPerson>();
  for (const p of people) if (p.id !== me && !seen.has(p.id)) seen.set(p.id, p);
  return [...seen.values()];
}

export function RoomBar({
  people,
  me,
  status,
  mayEdit,
  mode,
  onMode,
  pending,
}: {
  people: RoomPerson[];
  me: number;
  status: RoomStatus;
  mayEdit: boolean;
  mode: WriteMode;
  onMode: (mode: WriteMode) => void;
  /** Suggestions waiting, for the line a suggester reads. */
  pending: number;
}) {
  const others = othersIn(people, me);
  const names = others.map((p) => p.name);
  return (
    <div className="cap-collab-bar">
      <div className="cap-collab-people">
        {others.length > 0 ? (
          <AvatarGroup label={`Also here: ${names.join(", ")}`}>
            {others.map((p) => (
              <span key={p.id} className="cap-collab-person" data-who={personSlot(p.id)}>
                <Avatar name={p.name} size="sm" />
              </span>
            ))}
          </AvatarGroup>
        ) : null}
        <p className="cap-collab-line" role="status">
          {status === "offline" ? (
            <>
              <Status tone="warn">Offline</Status> Your changes are kept here and sent when the
              connection is back.
            </>
          ) : status === "connecting" ? (
            <Status tone="nodata" running>
              Connecting
            </Status>
          ) : others.length === 0 ? (
            "Only you are here."
          ) : (
            `${names.join(", ")} ${others.length === 1 ? "is" : "are"} here too.`
          )}
        </p>
      </div>
      {mayEdit ? (
        <Segmented
          legend="Changes you make"
          hideLegend
          size="sm"
          value={mode}
          onChange={onMode}
          options={[
            { value: "edit", label: "Editing" },
            { value: "suggest", label: "Suggesting" },
          ]}
        />
      ) : (
        <p className="cap-collab-note">
          You are suggesting: what you type shows as a suggestion until an editor accepts it.
          {pending > 0 ? ` ${pending} waiting.` : ""}
        </p>
      )}
    </div>
  );
}
