// capsomer site-data: the data files the showcase site reads (site/data), made from the tokens, the components and the test results.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { PKG, flag, readJsonFile, components, git } from "./cli.mjs";

export async function siteData() {
  const dataDir = join(PKG, "site", "data");
  mkdirSync(dataDir, { recursive: true });
  const pal = await import(pathToFileURL(join(PKG, "tokens", "palette.mjs")).href);
  // Every family's seed and its 12 steps in light and dark, for the Colors page (site/content.ts).
  const scales = Object.fromEntries(
    Object.entries(pal.FAMILIES).map(([n, f]) => [
      n,
      { light: pal.scale(f.seed, f.anchor, "light"), dark: pal.scale(f.seed, f.anchor, "dark") },
    ]),
  );
  writeFileSync(
    join(dataDir, "families.json"),
    JSON.stringify({ families: pal.FAMILIES, scales }, null, 2),
  );
  const runUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;

  // The test run, summarized per component, for --results-out (ci.yml keeps it with the run).
  const src = join(PKG, "test-results", "results.json");
  const results = {
    available: false,
    ran: null,
    components: {},
    totals: { passed: 0, failed: 0, skipped: 0 },
  };
  if (existsSync(src)) {
    const r = readJsonFile(src);
    results.available = true;
    results.ran = r.stats?.startTime ?? null;
    // The sweep (test/sweep.spec.ts) groups its tests in a describe block named for the component.
    const names = new Set(components(PKG).map((c) => c.name));
    const visit = (suite, file, theme, group) => {
      const f = suite.file ?? file;
      const th = /^(light|dark) theme$/.exec(suite.title ?? "")?.[1] ?? theme;
      const g = names.has(suite.title) ? suite.title : group;
      for (const spec of suite.specs ?? []) {
        // The spec's own file: a describe block made by a shared helper (eachTheme) names the helper's file.
        const path = (spec.file ?? f ?? "").replace(/\\/g, "/");
        const m = /^components\/([\w-]+)\//.exec(path) ?? /^site\//.exec(path);
        const comp = m?.[1] ?? g ?? "site";
        const kind = /^(keyboard|accessibility|behavior):/.exec(spec.title)?.[1] ?? "behavior";
        for (const t of spec.tests ?? []) {
          const status =
            t.status === "expected" || t.status === "flaky"
              ? "passed"
              : t.status === "skipped"
                ? "skipped"
                : "failed";
          const err =
            (t.results?.at(-1)?.error?.message
              ? stripVTControlCharacters(t.results.at(-1).error.message)
              : undefined
            )
              ?.split("\n")
              .slice(0, 6)
              .join("\n") ?? null;
          const entry = (results.components[comp] ??= {
            keyboard: { passed: 0, failed: 0 },
            accessibility: { passed: 0, failed: 0 },
            behavior: { passed: 0, failed: 0 },
            tests: [],
          });
          if (status !== "skipped") entry[kind][status]++;
          results.totals[status]++;
          entry.tests.push({
            title: spec.title,
            theme: th ?? null,
            kind,
            status,
            error: status === "failed" ? err : null,
          });
        }
      }
      for (const s of suite.suites ?? []) visit(s, f, th, g);
    };
    for (const s of r.suites ?? []) visit(s, s.file, null, null);
  }
  const resultsOut = flag("results-out");
  if (resultsOut)
    writeFileSync(
      resultsOut,
      JSON.stringify(
        { ...results, commit: git(["rev-parse", "--short", "HEAD"], PKG), runUrl },
        null,
        2,
      ),
    );
  console.log(
    `site-data: wrote site/data/families.json (test results${results.available ? `: ${results.totals.passed} passed, ${results.totals.failed} failed` : ": no test run found"})`,
  );
}
