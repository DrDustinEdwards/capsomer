import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { stateWord } from "../switch/switch.ts";
import { MISSING, failedMessage, reasonLabel, verbFor } from "./switch-reason.ts";

export interface SwitchWithReasonProps {
  // A fixed noun: "Improve loop".
  label: string;
  // The thing switched as it reads in the reason's label: "the improve loop". Defaults to label.
  name?: string;
  // The label's first words, given where the next state is known: "Pausing sample-d". Reads
  // "<verb>. Reason:". Defaults to "Turning <name> on" or "off".
  verb?: (next: boolean) => string;
  checked: boolean;
  // Saves the change with its reason (write the audit row here). The switch moves when it
  // resolves; a rejection keeps the reason open with the error. Offer Undo through the
  // message region once it resolves.
  onApply: (checked: boolean, reason: string) => Promise<void>;
  placeholder?: string;
  // Shown beside the switch while no reason is being asked for: "Paused: looking at a regression".
  note?: ReactNode;
}

export function SwitchWithReason({ label, name, verb, checked, onApply, placeholder, note }: SwitchWithReasonProps) {
  const base = useId();
  const reasonId = `${base}-why`;
  const errorId = `${base}-err`;
  const keysId = `${base}-keys`;
  const noun = name ?? label;
  const [on, setOn] = useState(checked);
  const [asking, setAsking] = useState(false);
  // The state the flip asks for, fixed when the reason opens, so a poll that lands meanwhile
  // and moves the switch cannot turn "off" into "on".
  const [target, setTarget] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const switchRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const next = asking ? target : !on;

  useEffect(() => setOn(checked), [checked]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (asking) reasonRef.current?.focus();
  }, [asking]);

  const ask = () => {
    if (asking) {
      reasonRef.current?.focus();
      return;
    }
    setTarget(!on);
    setReason("");
    setError(null);
    setAsking(true);
  };
  const close = () => {
    setAsking(false);
    setReason("");
    setError(null);
    switchRef.current?.focus();
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    // Read from the field too, so a value filled in without an input event counts.
    const text = (reasonRef.current?.value ?? reason).trim();
    if (!text) {
      setError(MISSING);
      reasonRef.current?.focus();
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onApply(target, text);
      if (!alive.current) return;
      setPending(false);
      setOn(target);
      close();
    } catch (err) {
      if (!alive.current) return;
      setPending(false);
      setError(failedMessage(noun, target, err));
      reasonRef.current?.focus();
    }
  };
  // Held while the request runs, so its answer is not hidden. Stopped here either way, so an
  // Esc that cancels the reason does not also close a panel the switch sits in.
  const onKey = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    if (!pending) close();
  };

  return (
    <div className="cap-switch-reason">
      <label className="cap-switch">
        {/* Controlled: a click or Space asks why, and React keeps the switch where it was. */}
        <input ref={switchRef} type="checkbox" role="switch" aria-busy={pending || undefined} checked={on} onChange={ask} />{" "}
        {label}{" "}
        <span className="cap-switch-state" aria-hidden="true">
          {stateWord(on)}
        </span>
      </label>
      {!asking && note ? <span className="cap-switch-reason-note">{note}</span> : null}
      <form className="cap-switch-reason-form" hidden={!asking} noValidate aria-busy={pending || undefined} onSubmit={submit} onKeyDown={onKey}>
        <div className="cap-field">
          <label className="cap-switch-reason-label" htmlFor={reasonId}>
            {reasonLabel(verb ? verb(next) : verbFor(noun, next))}
          </label>
          <input
            ref={reasonRef}
            className="cap-input"
            id={reasonId}
            autoComplete="off"
            required
            readOnly={pending}
            placeholder={placeholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${errorId} ${keysId}` : keysId}
          />
          <p className="cap-field-error" id={errorId} role={error ? "alert" : undefined} hidden={!error}>
            {error}
          </p>
        </div>
        <div className="cap-switch-reason-actions">
          <Button type="submit" variant="primary" pending={pending}>
            Apply
          </Button>
          <Button onClick={() => (pending ? undefined : close())}>Cancel</Button>
        </div>
        <span className="cap-switch-reason-keys" id={keysId}>
          <kbd>Enter</kbd> applies, <kbd>Esc</kbd> cancels. The reason is recorded with the change.
        </span>
      </form>
    </div>
  );
}
