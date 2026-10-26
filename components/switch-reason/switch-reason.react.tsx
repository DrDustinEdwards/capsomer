import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "../button/button.react.tsx";
import { stateWord } from "../switch/switch.ts";
import { MISSING, failedMessage, reasonLabel, verbFor } from "./switch-reason.ts";

export interface ReasonFormProps {
  // Shown and focused while true; hidden (and cleared for next time) while false.
  open: boolean;
  // The label's first words: "Changing the overnight run to run on API". Reads "<verb>. Reason:".
  verb: string;
  // Saves the change with its reason. A rejection keeps the form open with the error.
  onApply: (reason: string) => Promise<void>;
  // Cancel, or Esc. Return focus to the control that opened the form here.
  onCancel: () => void;
  // The words for a rejection. Defaults to the error's own message.
  failed?: (err: unknown) => string;
  // The reason field's id; one is made up when left out.
  id?: string;
  placeholder?: string;
  // Told when a request starts and ends, so the control beside the form can show it is busy.
  onPendingChange?: (pending: boolean) => void;
}

const ownMessage = (err: unknown) => (err instanceof Error && err.message ? err.message : String(err));

// The one-line reason a change asks for, beside the control that changes it: a switch (as
// SwitchWithReason), a radio group or any other control whose change is recorded with a reason.
// Enter applies (a reason is required), Esc cancels.
export function ReasonForm({ open, verb, onApply, onCancel, failed = ownMessage, id, placeholder, onPendingChange }: ReasonFormProps) {
  const base = useId();
  const reasonId = id ?? `${base}-why`;
  const errorId = `${reasonId}-err`;
  const keysId = `${reasonId}-keys`;
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPendingState] = useState(false);
  const reasonRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (open) reasonRef.current?.focus();
    else {
      setReason("");
      setError(null);
    }
  }, [open]);

  const setPending = (p: boolean) => {
    setPendingState(p);
    onPendingChange?.(p);
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
      await onApply(text);
      if (!alive.current) return;
      setPending(false);
    } catch (err) {
      if (!alive.current) return;
      setPending(false);
      setError(failed(err));
      reasonRef.current?.focus();
    }
  };
  // Held while the request runs, so its answer is not hidden. Stopped here either way, so an
  // Esc that cancels the reason does not also close a panel the form sits in.
  const onKey = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    if (!pending) onCancel();
  };

  return (
    <form className="cap-switch-reason-form" hidden={!open} noValidate aria-busy={pending || undefined} onSubmit={submit} onKeyDown={onKey}>
      <div className="cap-field">
        <label className="cap-switch-reason-label" htmlFor={reasonId}>
          {reasonLabel(verb)}
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
        <Button onClick={() => (pending ? undefined : onCancel())}>Cancel</Button>
      </div>
      <span className="cap-switch-reason-keys" id={keysId}>
        <kbd>Enter</kbd> applies, <kbd>Esc</kbd> cancels. The reason is recorded with the change.
      </span>
    </form>
  );
}

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
  // The switch's id, for an app that focuses it again (after an Undo) or presses it from a
  // command. The reason field is "<id>-why".
  id?: string;
}

export function SwitchWithReason({ label, name, verb, checked, onApply, placeholder, note, id }: SwitchWithReasonProps) {
  const noun = name ?? label;
  const [on, setOn] = useState(checked);
  const [asking, setAsking] = useState(false);
  // The state the flip asks for, fixed when the reason opens, so a poll that lands meanwhile
  // and moves the switch cannot turn "off" into "on".
  const [target, setTarget] = useState(false);
  const [pending, setPending] = useState(false);
  const switchRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const next = asking ? target : !on;

  useEffect(() => setOn(checked), [checked]);

  const ask = () => {
    if (asking) {
      formRef.current?.querySelector<HTMLInputElement>(".cap-input")?.focus();
      return;
    }
    setTarget(!on);
    setAsking(true);
  };
  const close = () => {
    setAsking(false);
    switchRef.current?.focus();
  };

  return (
    <div className="cap-switch-reason" ref={formRef}>
      <label className="cap-switch">
        {/* Controlled: a click or Space asks why, and React keeps the switch where it was. */}
        <input ref={switchRef} id={id} type="checkbox" role="switch" aria-busy={pending || undefined} checked={on} onChange={ask} />{" "}
        {label}{" "}
        <span className="cap-switch-state" aria-hidden="true">
          {stateWord(on)}
        </span>
      </label>
      {!asking && note ? <span className="cap-switch-reason-note">{note}</span> : null}
      <ReasonForm
        open={asking}
        id={id ? `${id}-why` : undefined}
        verb={verb ? verb(next) : verbFor(noun, next)}
        placeholder={placeholder}
        onPendingChange={setPending}
        failed={(err) => failedMessage(noun, target, err)}
        onApply={async (reason) => {
          await onApply(target, reason);
          setOn(target);
          close();
        }}
        onCancel={close}
      />
    </div>
  );
}
