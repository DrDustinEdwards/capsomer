import { useId, useState } from "react";
import { holders, holdings, type PermMatrix, type PermView } from "./permission-matrix.ts";

export interface PermissionMatrixProps {
  matrix: PermMatrix;
  // The table region's name and the agent cards' list name.
  label?: string;
  defaultView?: PermView;
  // Controlled view, for an app that keeps it in the address.
  view?: PermView;
  onViewChange?: (view: PermView) => void;
  note?: string;
}

const Yes = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m3.5 8.5 3 3 6-7" />
  </svg>
);

const No = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M4.5 8h7" />
  </svg>
);

function Names({ names }: { names: string[] }) {
  return (
    <>
      {names.map((n, i) => (
        <span key={n}>
          {i > 0 ? ", " : ""}
          <span className="cap-mono">{n}</span>
        </span>
      ))}
    </>
  );
}

export function PermissionMatrix(props: PermissionMatrixProps) {
  const { matrix, label = "Permissions by agent", defaultView = "agent", note } = props;
  const id = useId();
  const [own, setOwn] = useState<PermView>(defaultView);
  const view = props.view ?? own;
  const choose = (v: PermView) => {
    setOwn(v);
    props.onViewChange?.(v);
  };
  const byAgent = holdings(matrix);
  const byPerm = holders(matrix);

  return (
    <div className="cap-perms" data-cap="permission-matrix" data-cap-ready="" data-current={view}>
      <div className="cap-perms-bar">
        <fieldset className="cap-seg">
          <legend className="cap-sr-only">View</legend>
          {(["agent", "permission"] as const).map((v) => (
            <label key={v}>
              <input type="radio" name={`${id}-view`} value={v} checked={view === v} onChange={() => choose(v)} />
              {v === "agent" ? "By agent" : "By permission"}
            </label>
          ))}
        </fieldset>
        {note ? <p className="cap-perms-note">{note}</p> : null}
      </div>

      <div className="cap-perms-view" data-view="agent" hidden={view !== "agent"}>
        <div className="cap-perms-wide">
          <div className="cap-table-wrap" role="region" aria-label={label} tabIndex={0}>
            <table className="cap-table">
              <thead>
                <tr>
                  <th scope="col">Agent</th>
                  {matrix.permissions.map((p) => (
                    <th scope="col" className="cap-perms-col" key={p}>
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.agents.map((a) => (
                  <tr key={a.name}>
                    <th scope="row" className="cap-perms-agent cap-mono">
                      {a.name}
                    </th>
                    {matrix.permissions.map((p) => {
                      const held = a.holds.includes(p);
                      return (
                        <td className="cap-perms-cell" data-held={held ? "yes" : "no"} key={p}>
                          {held ? <Yes /> : <No />}
                          <span className="cap-sr-only">{held ? "Yes" : "No"}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="cap-perms-narrow">
          <ul className="cap-perms-cards" aria-label={label}>
            {byAgent.map((h) => (
              <li className="cap-perms-card" key={h.agent}>
                <span className="cap-perms-name cap-mono">{h.agent}</span>
                {h.held.length ? (
                  <div className="cap-perms-holds">
                    <span className="cap-perms-key">Holds:</span> {h.held.join(", ")}
                  </div>
                ) : (
                  <div className="cap-perms-holds" data-empty="">
                    Holds no permissions
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="cap-perms-view" data-view="permission" hidden={view !== "permission"}>
        <ul className="cap-perms-cards" aria-label="Agents by permission">
          {byPerm.map((h) => (
            <li className="cap-perms-card" key={h.permission}>
              <span className="cap-perms-name">{h.permission}</span>
              {h.agents.length ? (
                <div className="cap-perms-holds">
                  <span className="cap-perms-key">Held by:</span> <Names names={h.agents} />
                </div>
              ) : (
                <div className="cap-perms-holds" data-empty="">
                  Nobody holds this
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
