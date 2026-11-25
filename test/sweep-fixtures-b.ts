import { Fragment, createElement as h, type ReactElement } from "react";
import { Button } from "../dist/components/button/button.react.js";
import { PageHead } from "../dist/components/page-head/page-head.react.js";
import { Pagination } from "../dist/components/pagination/pagination.react.js";
import { Panel } from "../dist/components/panel/panel.react.js";
import { PeopleRoles } from "../dist/components/people-roles/people-roles.react.js";
import { PermissionMatrix } from "../dist/components/permission-matrix/permission-matrix.react.js";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../dist/components/popover/popover.react.js";
import { Row, RowList } from "../dist/components/row-list/row-list.react.js";
import { Segmented } from "../dist/components/segmented/segmented.react.js";
import { Select } from "../dist/components/select/select.react.js";
import { SessionList } from "../dist/components/session-row/session-row.react.js";
import {
  OgCardPreview,
  SerpPreview,
} from "../dist/components/share-preview/share-preview.react.js";
import { Shell } from "../dist/components/shell/shell.react.js";
import { Keys, ShortcutSheet } from "../dist/components/shortcuts/shortcuts.react.js";
import { Skeleton, Spinner } from "../dist/components/skeleton/skeleton.react.js";
import { StatTile, StatTiles } from "../dist/components/stat-tile/stat-tile.react.js";
import { DataTable } from "../dist/components/table/table.react.js";
import { Pill, Status } from "../dist/components/status/status.react.js";
import { SwitchWithReason } from "../dist/components/switch-reason/switch-reason.react.js";
import { Switch } from "../dist/components/switch/switch.react.js";
import { ThemeButton, ThemeSwitch } from "../dist/components/theme-switch/theme-switch.react.js";
import { Tooltip } from "../dist/components/tooltip/tooltip.react.js";
import { UsageMeter } from "../dist/components/usage-meter/usage-meter.react.js";

// More wrapper fixtures, from the same rule (sweep-fixtures-a.ts).
const noop = () => undefined;
const later = async () => undefined;
const NOW = Date.parse("2026-10-31T12:00:00Z");
export const FIXTURES_B: Record<string, () => ReactElement> = {
  "page-head": () =>
    h(PageHead, {
      title: "Media",
      crumbs: [{ label: "Sites", href: "#sites" }, { label: "Media" }],
      actions: h(Button, null, "Upload"),
    }),
  pagination: () =>
    h(Pagination, {
      page: 2,
      pageCount: 5,
      hrefFor: (n: number) => `?page=${n}`,
      total: 48,
      perPage: 10,
      noun: "posts",
    }),
  panel: () =>
    h(Panel, {
      title: "Checks",
      count: 3,
      children: h("p", null, "All passed."),
    }),
  "people-roles": () =>
    h(PeopleRoles, {
      action: "/members",
      now: NOW,
      data: {
        heading: "Lab members",
        people: [
          {
            email: "rosa@example.com",
            name: "Rosa Park",
            title: "Lab worker",
            endDate: "2027-01-31",
            status: "active",
            sync: "ready",
            manageable: true,
          },
        ],
        titles: [{ value: "worker", label: "Lab worker", defaultEnd: "2027-01-31" }],
      },
    }),
  "permission-matrix": () =>
    h(PermissionMatrix, {
      matrix: {
        permissions: ["read", "write"],
        agents: [{ name: "capsid-agent", holds: ["read"] }],
      },
    }),
  popover: () =>
    h(
      Popover,
      null,
      h(PopoverTrigger, null, "Details"),
      h(
        PopoverContent,
        null,
        h(
          PopoverHeader,
          null,
          h(PopoverTitle, null, "Job"),
          h(PopoverDescription, null, "Runs at noon."),
        ),
      ),
    ),
  "row-list": () =>
    h(RowList, {
      label: "Jobs",
      children: h(Row, {
        title: "Push the branch",
        href: "#push",
        detail: "Waiting for approval",
        meta: "2 min ago",
      }),
    }),
  segmented: () =>
    h(Segmented, {
      legend: "View",
      options: [
        { value: "grid", label: "Grid" },
        { value: "list", label: "List" },
      ],
      value: "grid",
      onChange: noop,
    }),
  select: () =>
    h(Select, {
      "aria-label": "Site",
      options: [
        { value: "com", label: "example.com" },
        { group: "Others", options: [{ value: "org", label: "example.org" }] },
      ],
    }),
  "session-row": () =>
    h(SessionList, {
      label: "Sessions",
      sessions: [
        {
          id: "s1",
          agent: "capsid-agent",
          state: "needs",
          since: NOW,
          age: "2 min",
          ask: {
            question: "Push the branch?",
            command: "git push",
            answers: [{ id: "yes", label: "Push", variant: "primary" }],
          },
        },
      ],
    }),
  "share-preview": () =>
    h(
      Fragment,
      null,
      h(SerpPreview, {
        url: "https://example.com/blog/spring-release",
        title: "Notes on the spring release",
        description: "What changed.",
      }),
      h(OgCardPreview, {
        image: h("img", { src: "/card.png", alt: "" }),
        host: "example.com",
        title: "Notes on the spring release",
      }),
    ),
  shell: () =>
    h(Shell, {
      brand: "Capsid",
      nav: [
        { id: "queue", label: "Queue", href: "#queue", current: true, count: 5 },
        { id: "sites", label: "Sites", href: "#sites" },
      ],
      children: h("p", null, "The page."),
    }),
  shortcuts: () =>
    h(
      Fragment,
      null,
      h(Keys, { spec: "g o" }),
      h(ShortcutSheet, { open: true, onOpenChange: noop }),
    ),
  skeleton: () =>
    h(Fragment, null, h(Spinner, { label: "Loading jobs" }), h(Skeleton, { lines: 2 })),
  "stat-tile": () =>
    h(StatTiles, {
      label: "This week",
      children: [
        h(StatTile, { key: "up", label: "Uptime", figure: "99.9", unit: "%", tone: "ok" }),
        h(StatTile, { key: "err", label: "Errors", tone: "nodata", reason: "No data yet" }),
      ],
    }),
  status: () =>
    h(
      Fragment,
      null,
      h(Status, { tone: "crit", children: "Down" }),
      h(Pill, { tone: "warn", href: "#mentions", children: "Mentions 4" }),
    ),
  "switch-reason": () =>
    h(SwitchWithReason, { label: "Pause the queue", checked: false, onApply: later }),
  switch: () => h(Switch, { label: "Email me" }),
  table: () =>
    h(DataTable<{ id: string; name: string; jobs: number }>, {
      caption: "Sites",
      rowKey: (r) => r.id,
      rows: [{ id: "a", name: "example.org", jobs: 4 }],
      empty: "No sites yet.",
      columns: [
        { key: "name", header: "Site", cell: (r) => r.name, sortBy: (r) => r.name },
        { key: "jobs", header: "Jobs", num: true, cell: (r) => r.jobs },
      ],
    }),
  "theme-switch": () =>
    h(Fragment, null, h(ThemeSwitch, { initial: "light" }), h(ThemeButton, { initial: "dark" })),
  tooltip: () =>
    h(Tooltip, {
      tip: "3 failed checks",
      children: (t) => h("button", { ...t, type: "button", className: "cap-btn" }, "example.com"),
    }),
  "usage-meter": () =>
    h(UsageMeter, {
      now: NOW,
      items: [
        {
          id: "runs",
          name: "Runs",
          amount: "40 of 100",
          used: 40,
          limit: 100,
          history: [10, 20, 40],
          resetsAt: NOW + 86_400_000,
        },
      ],
    }),
};
