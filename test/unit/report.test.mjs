import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const BIN = resolve("bin/capsomer.mjs");

// `capsomer report` on a sample app: Capsomer's own classes, an app-* class, a site that renders
// ErrorPage and Capsomer's own markup are not own copies (each was one before 0.50); a real copy is.
test("report finds an app's own copy and not Capsomer's own markup", () => {
  const app = mkdtempSync(join(tmpdir(), "capsomer-report-"));
  try {
    mkdirSync(join(app, "app"));
    writeFileSync(join(app, "package.json"), JSON.stringify({ name: "sample-app" }));
    writeFileSync(
      join(app, "app", "uses.tsx"),
      [
        'import { ErrorPage } from "capsomer/react/error-page";',
        'import { ConfirmDialog } from "capsomer/react/confirm-dialog";',
        'import { isRouteErrorResponse } from "react-router";',
        "export function ErrorBoundary({ error }) {",
        "  const notFound = isRouteErrorResponse(error) && error.status === 404;",
        '  return <div className="app-page"><button className="cap-btn" data-variant="primary">Save</button><span className="cap-chip">Draft</span><p className="cap-field-hint">Hint</p><ErrorPage error={error} /></div>;',
        "}",
      ].join("\n"),
    );
    writeFileSync(join(app, "app", "tabs.html"), '<div class="cap-tabs-list" role="tablist"><button class="cap-tab" role="tab">One</button></div>\n');
    writeFileSync(join(app, "app", "own.html"), '<p>Plain</p>\n<button class="btn primary">Save</button>\n');
    const out = join(app, "report.json");
    execFileSync(process.execPath, [BIN, "report", "--out", out], { cwd: app, stdio: "ignore" });
    const r = JSON.parse(readFileSync(out, "utf8"));
    assert.deepEqual(r.ownCopies.items, [{ component: "button", file: "app/own.html", line: 2 }]);
    assert.ok(r.components.names.includes("button") && r.components.names.includes("error-page"));
  } finally {
    rmSync(app, { recursive: true, force: true });
  }
});
