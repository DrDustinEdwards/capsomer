// Mounts the status matrix specimen.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MatrixKey, StatusMatrix, type MatrixCell } from "./status-matrix.react.tsx";

const done: MatrixCell = { tone: "ok", label: "Done" };
const partial = (reason: string): MatrixCell => ({ tone: "warn", label: "Partial", reason });
const failing = (reason: string): MatrixCell => ({ tone: "crit", label: "Failing", reason });
const unmeasured = (reason: string): MatrixCell => ({
  tone: "muted",
  glyph: "unknown",
  label: "Could not measure",
  reason,
});

const columns = [
  "example.com",
  "docs.example.com",
  "shop.example.com",
  "blog.example.com",
  "api.example.com",
].map((name) => ({ id: name, name }));

const rows = [
  {
    id: "a11y",
    name: <a href="#a11y">Accessibility</a>,
    text: "Accessibility",
    cells: {
      "example.com": done,
      "docs.example.com": done,
      "shop.example.com": partial("2 pages miss a skip link"),
      "blog.example.com": done,
    },
  },
  {
    id: "seo",
    name: <a href="#seo">Search and AI readers</a>,
    text: "Search and AI readers",
    cells: {
      "example.com": done,
      "docs.example.com": failing("No llms.txt"),
      "shop.example.com": done,
      "blog.example.com": done,
      "api.example.com": done,
    },
  },
  {
    id: "backup",
    name: <a href="#backup">Backups</a>,
    text: "Backups",
    cells: {
      "example.com": done,
      "docs.example.com": done,
      "shop.example.com": done,
      "blog.example.com": partial("Last dump 30 hours old"),
      "api.example.com": unmeasured("The backup check timed out"),
    },
  },
];

const el = document.querySelector<HTMLElement>("[data-mount='grid']");
if (el)
  createRoot(el).render(
    <StrictMode>
      <StatusMatrix caption="Completeness by area and site" columns={columns} rows={rows} />
      <MatrixKey
        items={[
          { tone: "ok", label: "Done" },
          { tone: "warn", label: "Partial" },
          { tone: "crit", label: "Failing" },
          { tone: "muted", glyph: "unknown", label: "Could not measure" },
        ]}
      />
    </StrictMode>,
  );
