import { Fragment, createElement as h, type ReactElement } from "react";
import { AnchorBar } from "../dist/components/anchor-bar/anchor-bar.react.js";
import { ApprovalSheet } from "../dist/components/approval-sheet/approval-sheet.react.js";
import { AttentionList } from "../dist/components/attention-list/attention-list.react.js";
import { Avatar, AvatarGroup } from "../dist/components/avatar/avatar.react.js";
import { Alert, Banner } from "../dist/components/banner/banner.react.js";
import { Breadcrumb } from "../dist/components/breadcrumb/breadcrumb.react.js";
import { BulkBar } from "../dist/components/bulk-bar/bulk-bar.react.js";
import { Button, ButtonGroup, ButtonGroupText } from "../dist/components/button/button.react.js";
import { FilterChips } from "../dist/components/chips/chips.react.js";
import {
  ConfirmDialog,
  ConfirmPage,
} from "../dist/components/confirm-dialog/confirm-dialog.react.js";
import { DatePicker } from "../dist/components/date-picker/date-picker.react.js";
import {
  DetailCommand,
  DetailPanel,
  DetailSection,
} from "../dist/components/detail-panel/detail-panel.react.js";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dist/components/dialog/dialog.react.js";
import { Disclosure, Group } from "../dist/components/disclosure/disclosure.react.js";
import { DropZone } from "../dist/components/drop-zone/drop-zone.react.js";
import { Empty, Wait } from "../dist/components/empty/empty.react.js";
import { ErrorSummary } from "../dist/components/error-summary/error-summary.react.js";
import { Feed } from "../dist/components/feed/feed.react.js";
import {
  CharacterCount,
  Check,
  DateInput,
  Field,
  InputGroup,
  InputGroupAddon,
  NumberField,
  PasswordInput,
  Range,
  SearchField,
} from "../dist/components/field/field.react.js";
import {
  Listbox,
  ListboxSeparator,
  Option,
  OptionGroup,
} from "../dist/components/listbox/listbox.react.js";
import { MessageProvider } from "../dist/components/message/message.react.js";
import { Meter } from "../dist/components/meter/meter.react.js";

// A wrapper with no React specimen (no examples.tsx) is checked against one small fixture,
// rendered to HTML as a server would: the cheapest real check that it writes the contract.
const noop = () => undefined;
const later = async () => undefined;
export const FIXTURES_A: Record<string, () => ReactElement> = {
  "anchor-bar": () =>
    h(AnchorBar, {
      sections: [
        { id: "overview", label: "Overview" },
        { id: "checks", label: "Checks" },
      ],
      always: true,
    }),
  "approval-sheet": () =>
    h(ApprovalSheet, {
      open: true,
      gates: [
        { id: "push", title: "Push the capsomer branch", command: "git push origin a11y-all" },
      ],
      onApprove: noop,
      onClose: noop,
    }),
  "attention-list": () =>
    h(AttentionList, {
      title: "Needs you",
      items: [
        {
          id: "down",
          tone: "crit",
          title: "example.com does not answer",
          detail: "3 failed checks since 13:40",
          href: "#down",
        },
        { id: "cert", tone: "warn", title: "Renew example.org's certificate", href: "#cert" },
      ],
    }),
  avatar: () =>
    h(
      Fragment,
      null,
      h(Avatar, { name: "Rosa Park" }),
      h(AvatarGroup, { label: "Reviewers", extra: 2, children: h(Avatar, { name: "Sam Okafor" }) }),
    ),
  banner: () =>
    h(
      Fragment,
      null,
      h(Banner, {
        title: "Maintenance tonight",
        onDismiss: noop,
        children: "The queue pauses at 22:00 UTC.",
      }),
      h(Alert, { title: "The draft was not saved", children: "Try again in a minute." }),
    ),
  breadcrumb: () =>
    h(Breadcrumb, {
      items: [
        { label: "Sites", href: "#sites" },
        { label: "fieldnotes.example", href: "#site" },
        { label: "Media", href: "#media" },
        { label: "IMG_4821" },
      ],
      maxItems: 3,
    }),
  "bulk-bar": () =>
    h(BulkBar, {
      items: [{ id: "p1", label: "Notes on the spring release" }],
      actions: [
        { id: "publish", label: "Publish" },
        { id: "delete", label: "Delete", destructive: true },
      ],
      onClear: noop,
      total: 4,
    }),
  button: () =>
    h(
      Fragment,
      null,
      h(Button, { variant: "primary" }, "Save"),
      h(
        ButtonGroup,
        { label: "Zoom" },
        h(Button, null, "Smaller"),
        h(ButtonGroupText, null, "100%"),
      ),
    ),
  chips: () =>
    h(FilterChips, {
      label: "Status",
      options: [
        { value: "open", label: "Open" },
        { value: "done", label: "Done" },
      ],
      value: ["open"],
      onChange: noop,
      count: "12 shown",
    }),
  "confirm-dialog": () =>
    h(
      Fragment,
      null,
      h(ConfirmDialog, {
        open: true,
        title: "Delete 3 drafts?",
        body: ["They are gone for good."],
        action: "Delete",
        perform: later,
        onClose: noop,
      }),
      h(ConfirmPage, {
        title: "Delete fieldnotes.example?",
        cancelHref: "#back",
        typeToConfirm: "fieldnotes",
      }),
    ),
  "date-picker": () => h(DatePicker, { label: "Publish on", name: "on" }),
  "detail-panel": () =>
    h(DetailPanel, {
      open: true,
      onClose: noop,
      id: "job_7f3a",
      title: "Push the capsomer branch",
      kind: "Job",
      children: h(DetailSection, {
        title: "Command",
        children: h(DetailCommand, { text: "git push origin a11y-all" }),
      }),
    }),
  dialog: () =>
    h(
      Dialog,
      { open: true, onOpenChange: noop },
      h(DialogHeader, null, h(DialogTitle, null, "Rename the draft")),
      h(DialogBody, null, "The old address redirects."),
      h(DialogFooter, null, h(DialogClose, { part: "cancel" }, "Cancel")),
    ),
  disclosure: () =>
    h(
      Fragment,
      null,
      h(Disclosure, { summary: "What the check reads", children: "The site's sitemap." }),
      h(Group, {
        label: "Warnings",
        count: 2,
        children: h("p", null, "Two certificates end this month."),
      }),
    ),
  "drop-zone": () => h(DropZone, { name: "files", title: "Drop pictures here" }),
  empty: () =>
    h(
      Fragment,
      null,
      h(Empty, { kind: "no-match", title: "No posts match" }),
      h(Wait, { label: "Loading posts", children: h("p", null, "Posts") }),
    ),
  "error-summary": () =>
    h(ErrorSummary, {
      errors: [
        { id: "email", text: "Enter an email address" },
        { id: "name", text: "Enter a name" },
      ],
    }),
  feed: () =>
    h(Feed, {
      days: [
        {
          id: "today",
          label: "Today",
          events: [
            {
              id: "e1",
              tone: "ok",
              what: "Deployed capsomer",
              when: "10:02",
              at: "2026-10-31T10:02:00Z",
            },
          ],
        },
      ],
    }),
  field: () =>
    h(
      Fragment,
      null,
      h(Field, {
        label: "Email",
        help: "Your work address",
        error: "Enter an email address",
        children: (p) => h("input", { ...p, className: "cap-input", type: "email" }),
      }),
      h(Check, { label: "Send me the digest" }),
      h(Range, { "aria-label": "Volume", value: 4, max: 10 }),
      h(
        InputGroup,
        { label: "Price" },
        h(InputGroupAddon, null, "$"),
        h("input", { className: "cap-input" }),
      ),
      h(PasswordInput, { label: "Password", name: "password" }),
      h(CharacterCount, { label: "Summary", value: "Short", limit: 160 }),
      h(NumberField, { label: "Copies", value: 2, onChange: noop }),
      h(SearchField, { label: "Search posts", value: "", onChange: noop }),
      h(DateInput, {
        legend: "Date of birth",
        name: "dob",
        value: { day: "", month: "", year: "" },
        onChange: noop,
      }),
    ),
  listbox: () =>
    h(
      Listbox,
      { "aria-label": "Sites", selection: "single" },
      h(
        OptionGroup,
        { label: "Watch" },
        h(Option, { id: "o1", value: "com", selected: true }, "example.com"),
        h(Option, { id: "o2", value: "org" }, "example.org"),
      ),
      h(ListboxSeparator),
    ),
  message: () => h(MessageProvider, null, h("p", null, "The page.")),
  meter: () => h(Meter, { label: "Storage", value: 7, max: 10, valueText: "7 of 10 GB" }),
};
