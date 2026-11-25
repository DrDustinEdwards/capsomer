import { useId, useRef, type ReactNode } from "react";
import { Icon, iconChevronLeft } from "../icons/icons.react.tsx";
import { useHydrated } from "../hooks/hooks.react.tsx";
import type { BreadcrumbItem, BreadcrumbProps } from "../breadcrumb/breadcrumb.react.tsx";
import { PageHead } from "../page-head/page-head.react.tsx";
import { Switch } from "../switch/switch.react.tsx";

// One setting on its own line: its name at the start, its control at the end, a rule between
// rows. `children` is given the ids to name the control with and, when it cannot be changed, to
// describe it with the reason, so the row's words are the control's name and description.
export function SettingsRow({
  label,
  disabledReason,
  children,
}: {
  label: ReactNode;
  disabledReason?: ReactNode;
  children: (ids: { labelId: string; reasonId?: string }) => ReactNode;
}) {
  const base = useId();
  const labelId = `${base}-label`;
  const reasonId = disabledReason ? `${base}-reason` : undefined;
  return (
    <div className="cap-settings-row">
      <div className="cap-settings-row-text">
        <span className="cap-settings-row-label" id={labelId}>
          {label}
        </span>
        {disabledReason ? (
          <p className="cap-settings-row-reason" id={reasonId}>
            {disabledReason}
          </p>
        ) : null}
      </div>
      <div className="cap-settings-row-control">{children({ labelId, reasonId })}</div>
    </div>
  );
}

export interface SwitchRowProps {
  name?: string;
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  busy?: boolean;
  form?: string;
  // Send the switch's form as soon as it is flipped: the setting takes effect at once, as a
  // switch should. Without script a Save button for that form stands in.
  submitOnChange?: boolean;
  saveLabel?: string;
  // Why it cannot be changed here ("Only the account owner can change this."): the switch is
  // disabled and described by these words, never dimmed with no reason.
  disabledReason?: ReactNode;
}

export function SwitchRow({
  name,
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  busy,
  form,
  submitOnChange = false,
  saveLabel = "Save",
  disabledReason,
}: SwitchRowProps) {
  const ready = useHydrated();
  const input = useRef<HTMLInputElement>(null);
  const off = disabledReason != null && disabledReason !== false && disabledReason !== "";
  return (
    <SettingsRow label={label} disabledReason={off ? disabledReason : undefined}>
      {({ labelId, reasonId }) => (
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
            aria-describedby={reasonId}
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

export function SettingsLayout({
  title,
  crumbs,
  renderLink,
  back = { href: "/settings", label: "Settings" },
  actions,
  children,
}: {
  title: ReactNode;
  crumbs?: BreadcrumbItem[];
  renderLink?: BreadcrumbProps["renderLink"];
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
      <PageHead title={title} crumbs={crumbs} renderLink={renderLink} actions={actions} />
      {children}
    </div>
  );
}

function BackWords({ label }: { label: string }) {
  return (
    <>
      <Icon d={iconChevronLeft} className="cap-icon-flip" />
      {label}
    </>
  );
}
