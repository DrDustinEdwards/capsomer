import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import {
  COPIED_MS,
  COPY_FAILED_MS,
  copyText,
  distinct,
  messageFor,
  shareLink,
  type ShareOutcome,
} from "./copy.ts";
import { Icon } from "../icons/icons.react.tsx";
import { iconCheck, iconCopy } from "../icons/icons.ts";

type Outcome = "copied" | "failed" | ShareOutcome;

// The copy state for a React control: run() copies (or shares) and keeps the outcome and its
// message for as long as the message should show. A repeat restarts it. Never throws.
export function useCopy(messages: { copied?: string; failed?: string } = {}) {
  const [state, setState] = useState<"done" | "failed" | undefined>();
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback(
    (outcome: Outcome) => {
      clearTimeout(timer.current);
      const own =
        outcome === "copied" ? messages.copied : outcome === "failed" ? messages.failed : undefined;
      const text = own ?? messageFor(outcome);
      setState(undefined);
      setMessage("");
      if (!text) return;
      requestAnimationFrame(() => {
        setState(outcome === "failed" ? "failed" : "done");
        setMessage(distinct(text));
      });
      timer.current = setTimeout(
        () => {
          setState(undefined);
          setMessage("");
        },
        outcome === "failed" ? COPY_FAILED_MS : COPIED_MS,
      );
    },
    [messages.copied, messages.failed],
  );
  const copy = useCallback(
    async (text: string) => {
      const ok = await copyText(text);
      show(ok ? "copied" : "failed");
      return ok;
    },
    [show],
  );
  const share = useCallback(
    async (data: { url: string; title?: string }) => {
      const outcome = await shareLink(data);
      show(outcome);
      return outcome;
    },
    [show],
  );
  return { copy, share, state, message };
}

export interface CopyButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "type" | "style" | "children"
> {
  // What is copied: a string, or a function read at the press (a field's current value).
  text?: string | (() => string);
  // Share this link with the system share sheet; copies it where sharing is missing.
  share?: { url: string; title?: string };
  // The visible label. Leave it out for an icon-only button, and give aria-label instead,
  // naming what is copied ("Copy API key").
  children?: ReactNode;
  copiedMessage?: string;
  failedMessage?: string;
  variant?: "default" | "quiet" | "secondary";
  size?: "xs" | "sm";
  onCopied?: (ok: boolean) => void;
}

// A copy (or share) button with its status bubble beside it: the HTML contract in copy.md.
export function CopyButton(props: CopyButtonProps) {
  const {
    text,
    share,
    children,
    copiedMessage,
    failedMessage,
    variant = "quiet",
    size,
    onCopied,
    className,
    ...rest
  } = props;
  const {
    copy,
    share: doShare,
    state,
    message,
  } = useCopy({
    copied: copiedMessage,
    failed: failedMessage,
  });
  const onClick = async () => {
    if (share) {
      const outcome = await doShare(share);
      onCopied?.(outcome !== "failed");
      return;
    }
    const value = typeof text === "function" ? text() : (text ?? "");
    onCopied?.(await copy(value));
  };
  return (
    <span className={className ? `cap-copy ${className}` : "cap-copy"}>
      <button
        {...rest}
        type="button"
        className="cap-btn cap-copy-button"
        data-variant={variant}
        data-size={size}
        data-state={state}
        onClick={() => void onClick()}
      >
        <span className="cap-copy-icon">
          <Icon d={iconCopy} />
        </span>
        <span className="cap-copy-done">
          <Icon d={iconCheck} />
        </span>
        {children}
      </button>
      <span className="cap-copy-tip" role="status">
        {message}
      </span>
    </span>
  );
}
