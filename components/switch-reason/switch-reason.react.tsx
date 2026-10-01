import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "../button/button.react.tsx";
import { stateWord } from "../switch/switch.ts";
import { MISSING, failedMessage, question } from "./switch-reason.ts";

export interface SwitchWithReasonProps {
  // A fixed noun: "Improve loop".
  label: string;
  // The thing switched as it reads in the question: "the improve loop". Defaults to label.
  name?: string;
  checked: boolean;
  // Saves the change with its reason (write the audit row here). The switch moves when it
  // resolves; a rejection keeps the form open with the error. Offer Undo through the
  // message region once it resolves.
  onApply: (checked: boolean, reason: string) => Promise<void>;
  placeholder?: string;
}

export function SwitchWithReason({ label, name, checked, onApply, placeholder }: SwitchWithReasonProps) {
  const base = useId();
  const reasonId = `${base}-why`;
  const errorId = `${base}-err`;
  const noun = name ?? label;
  const [on, setOn] = useState(checked);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const switchRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);
  const next = !on;

  useEffect(() => setOn(checked), [checked]);
  useEffect(() => {
    if (asking) reasonRef.current?.focus();
  }, [asking]);

  const ask = () => {
    if (pending) return;
    if (asking) {
      reasonRef.current?.focus();
      return;
    }
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
    const text = reason.trim();
    if (!text) {
      setError(MISSING);
      reasonRef.current?.focus();
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onApply(next, text);
      setPending(false);
      setOn(next);
      close();
    } catch (err) {
      setPending(false);
      setError(failedMessage(noun, next, err));
      reasonRef.current?.focus();
    }
  };
  const onKey = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Escape" || pending) return;
    e.preventDefault();
    close();
  };

  return (
    <div className="cap-switch-reason">
      <label className="cap-switch">
        {/* Controlled: a click or Space asks why, and React keeps the switch where it was. */}
        <input ref={switchRef} type="checkbox" role="switch" checked={on} onChange={ask} />{" "}
        {label}{" "}
        <span className="cap-switch-state" aria-hidden="true">
          {stateWord(on)}
        </span>
      </label>
      <form className="cap-switch-reason-form" hidden={!asking} noValidate onSubmit={submit} onKeyDown={onKey}>
        <div className="cap-field">
          <label className="cap-field-label" htmlFor={reasonId}>
            {question(noun, next)}
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
            aria-describedby={error ? errorId : undefined}
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
          <span className="cap-switch-reason-keys">
            <kbd>Enter</kbd> applies, <kbd>Esc</kbd> cancels
          </span>
        </div>
      </form>
    </div>
  );
}
