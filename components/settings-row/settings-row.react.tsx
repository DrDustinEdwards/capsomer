import { useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { BreadcrumbItem, BreadcrumbProps } from "../breadcrumb/breadcrumb.react.tsx";
import { PageHead } from "../page-head/page-head.react.tsx";
import { Switch } from "../switch/switch.react.tsx";

const noSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

// One setting on its own line: its name and one line on what it does at the start, its control
// at the end, a rule between rows. `children` is given the ids to name and describe the control
// with, so the row's words are the control's name and description.
export function SettingsRow({
  label,
  help,
  children,
}: {
  label: ReactNode;
  help?: ReactNode;
  children: (ids: { labelId: string; helpId?: string }) => ReactNode;
}) {
  const base = useId();
  const labelId = `${base}-label`;
  const helpId = help ? `${base}-help` : undefined;
  return (
    <div className="cap-settings-row">
      <div className="cap-settings-row-text">
        <span className="cap-settings-row-label" id={labelId}>
          {label}
        </span>
        {help ? (
          <p className="cap-settings-row-help" id={helpId}>
            {help}
          </p>
        ) : null}
      </div>
      <div className="cap-settings-row-control">{children({ labelId, helpId })}</div>
    </div>
  );
}

export interface SwitchRowProps {
  name?: string;
  label: ReactNode;
  help?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  busy?: boolean;
  // The id of the form the switch belongs to, when it sits outside it (its `form` attribute).
  form?: string;
  // Send the switch's form as soon as it is flipped: the setting takes effect at once, as a
  // switch should. Without script a Save button for that form stands in.
  submitOnChange?: boolean;
  saveLabel?: string;
  // Why it cannot be changed here ("Only the account owner can change this."): the switch is
  // disabled and described by these words, never dimmed with no reason.
  disabledReason?: ReactNode;
}

// A settings row whose control is a switch, named by the row's label and described by its line.
export function SwitchRow({
  name,
  label,
  help,
  checked,
  defaultChecked,
  onCheckedChange,
  busy,
  form,
  submitOnChange = false,
  saveLabel = "Save",
  disabledReason,
}: SwitchRowProps) {
  const ready = useMounted();
  const reasonId = useId();
  const input = useRef<HTMLInputElement>(null);
  const off = disabledReason != null && disabledReason !== false && disabledReason !== "";
  return (
    <SettingsRow
      label={label}
      help={
        help || off ? (
          <>
            {help}
            {off ? (
              <span className="cap-settings-row-reason" id={reasonId}>
                {help ? " " : null}
                {disabledReason}
              </span>
            ) : null}
          </>
        ) : undefined
      }
    >
      {({ labelId, helpId }) => (
        <>
          <Switch
            ref={input}
            name={name}
            form={form}
            label={null}
            checked={checked}
            defaultChecked={defaultChecked}
            busy={busy}
            disabled={off}
            aria-labelledby={labelId}
            aria-describedby={helpId}
            onCheckedChange={(on) => {
              onCheckedChange?.(on);
              if (submitOnChange) input.current?.form?.requestSubmit();
            }}
          />
          {submitOnChange && !ready && !off ? (
            <button type="submit" form={form} className="cap-btn" data-size="sm">
              {saveLabel}
            </button>
          ) : null}
        </>
      )}
    </SettingsRow>
  );
}

// A settings page: the page head (title, its line, the trail) and, on a phone, where the
// settings menu is hidden, a link back to the settings index above it.
export function SettingsLayout({
  title,
  lead,
  crumbs,
  renderLink,
  back = { href: "/settings", label: "Settings" },
  actions,
  children,
}: {
  title: ReactNode;
  lead?: ReactNode;
  crumbs?: BreadcrumbItem[];
  renderLink?: BreadcrumbProps["renderLink"];
  // The settings index; null for none.
  back?: { href: string; label: string } | null;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const backLink = back ? (
    renderLink ? (
      renderLink({
        href: back.href,
        children: <BackWords label={back.label} />,
        className: "cap-settings-back",
      })
    ) : (
      <a className="cap-settings-back" href={back.href}>
        <BackWords label={back.label} />
      </a>
    )
  ) : null;
  return (
    <div className="cap-settings-page">
      {backLink}
      <PageHead
        title={title}
        lead={lead}
        crumbs={crumbs}
        renderLink={renderLink}
        actions={actions}
      />
      {children}
    </div>
  );
}

function BackWords({ label }: { label: string }) {
  return (
    <>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M10 3L5 8l5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </>
  );
}
