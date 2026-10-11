import { expect, test, type Page } from "@playwright/test";
import { eachTheme, expectContrast, expectNoAxeViolations, visitStates } from "../../test/helpers.ts";

// The ids are the examples' own (examples.html): #map the live map, #map-chosen with Carrel
// chosen, #map-inside entered, #map-flow playing a job's life at step 6, #map-plain in the
// plain view, #map-states with forced states, #map-plain-html as delivered with no script.
const tile = (page: Page, map: string, id: string) => page.locator(`#${map} .cap-system-map-tile[data-id='${id}']`);
const focusedId = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.id ?? document.activeElement?.textContent ?? "");

eachTheme((theme) => {
  test.beforeEach(async ({ page }) => {
    await visitStates(page, "system-map", theme);
  });

  test("accessibility: no axe violations", async ({ page }) => {
    await expectNoAxeViolations(page);
  });

  test("accessibility: a name, its word, a private word, the core, a chosen capsomer and the detail reach their contrast", async ({ page }) => {
    await expectContrast(page, [
      { sel: "#map [data-id='carrel'] .cap-system-map-name", what: "a capsomer's name" },
      { sel: "#map [data-id='carrel'] .cap-system-map-tag", what: "its word" },
      { sel: "#map [data-id='prelum'] .cap-system-map-name", what: "a shared part's name, on its tint" },
      { sel: "#map [data-id='foxing'] .cap-system-map-tag", what: "the word private" },
      { sel: "#map [data-id='capsid'] .cap-system-map-name", what: "the core's name" },
      { sel: "#map-chosen [data-id='carrel'] .cap-system-map-name", what: "a chosen capsomer's name" },
      { sel: "#map-chosen .cap-system-map-detail-text", what: "the detail line" },
      { sel: "#map-inside .cap-system-map-box-name", what: "a part inside the core" },
      { sel: "#map-inside [data-external] .cap-system-map-box-name", what: "a part outside the core" },
      { sel: "#map-flow [data-at] .cap-system-map-box-name", what: "the part a step moves toward" },
      { sel: "#map-flow .cap-system-map-detail-text", what: "a flow's step" },
    ]);
  });

  test("accessibility: chosen and private are marked by more than colour", async ({ page }) => {
    const stroke = (sel: string, prop: string) => page.locator(sel).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
    expect(Number.parseFloat(await stroke("#map-chosen [data-id='carrel'] polygon", "stroke-width"))).toBeGreaterThan(Number.parseFloat(await stroke("#map-chosen [data-id='enarratio'] polygon", "stroke-width")));
    expect(await stroke("#map [data-id='foxing'] polygon", "stroke-dasharray")).not.toBe("none");
    await expect(tile(page, "map", "foxing")).toHaveAttribute("aria-label", "Foxing, private");
  });

  test("accessibility: the map is a group of named buttons, and the list holds the same systems", async ({ page }) => {
    const map = page.getByRole("group", { name: "The family", exact: true });
    await expect(map.getByRole("button", { name: "Capsid" })).toHaveAttribute("aria-pressed", "false");
    await expect(map.getByRole("button", { name: "Carrel, tool" })).toBeAttached();
    const tiles = await page.locator("#map .cap-system-map-tile[role='button']").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id).sort());
    const items = await page.locator("#map .cap-system-map-list li[data-id]").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id).sort());
    expect(tiles.length).toBe(16);
    expect(items).toEqual(tiles);
  });

  test("keyboard: Tab enters on the core and leaves in one press; arrows move to the neighbour that way, Home and End", async ({ page }) => {
    const stops = () => page.locator("#map .cap-system-map-tile[tabindex='0']").count();
    expect(await stops()).toBe(1);
    await page.locator("#map .cap-system-map-views button").last().focus();
    await page.keyboard.press("Tab");
    expect(await focusedId(page)).toBe("capsid");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("#map .cap-system-map-stage"))).toBe(false);
    await tile(page, "map", "capsid").focus();
    const xy = (id: string) => tile(page, "map", id).evaluate((el) => [Number((el as HTMLElement).dataset.x), Number((el as HTMLElement).dataset.y)]);
    const [cx, cy] = await xy("capsid");
    await page.keyboard.press("ArrowUp");
    const up = await focusedId(page);
    expect((await xy(up))[1]).toBeLessThan(cy!);
    await page.keyboard.press("ArrowDown");
    expect(await focusedId(page)).toBe("capsid");
    await page.keyboard.press("ArrowRight");
    expect((await xy(await focusedId(page)))[0]).toBeGreaterThan(cx!);
    await page.keyboard.press("End");
    expect(await focusedId(page)).not.toBe("capsid");
    await page.keyboard.press("Home");
    expect(await focusedId(page)).toBe("capsid");
    expect(await stops()).toBe(1);
  });

  test("keyboard: Enter chooses and draws the lines, Escape clears", async ({ page }) => {
    await tile(page, "map", "carrel").focus();
    await page.keyboard.press("Enter");
    await expect(tile(page, "map", "carrel")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#map .cap-system-map-edge[data-on]")).toHaveCount(4);
    await expect(page.locator("#map .cap-system-map-detail")).toContainText("4 connections drawn");
    await page.keyboard.press("Space");
    await expect(tile(page, "map", "carrel")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(tile(page, "map", "carrel")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#map .cap-system-map-edge[data-on]")).toHaveCount(0);
  });

  test("keyboard: Enter on the chosen core goes inside, Escape steps out to the core", async ({ page }) => {
    await tile(page, "map", "capsid").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect(page.locator("#map")).toHaveAttribute("data-entered", "");
    await expect(page.locator("#map").getByRole("img", { name: /Inside Capsid: MCP Worker, Portal, Five-minute tick/ })).toBeVisible();
    await expect(page.locator("#map").getByRole("button", { name: "Step out" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#map")).not.toHaveAttribute("data-entered", "");
    expect(await focusedId(page)).toBe("capsid");
  });

  test("behaviour: a pointer chooses, and Go inside and Step out work as buttons", async ({ page }) => {
    await tile(page, "map", "capsid").click();
    await page.locator("#map").getByRole("button", { name: "Go inside" }).click();
    await expect(page.locator("#map")).toHaveAttribute("data-entered", "");
    await page.locator("#map").getByRole("button", { name: "Step out" }).click();
    await expect(page.locator("#map")).not.toHaveAttribute("data-entered", "");
    const events = page.evaluate(() => new Promise((resolve) => document.querySelector("#map")!.addEventListener("cap:system-map-select", (e) => resolve((e as CustomEvent).detail), { once: true })));
    await tile(page, "map", "enarratio").click();
    expect(await events).toEqual({ id: "enarratio" });
  });

  test("lines: no line crosses a label, and every label is painted over the lines", async ({ page }) => {
    // Every line on the map, drawn or not, sampled along its length against every label's
    // drawn box: a line through a capsomer's middle fails here.
    const crossings = await page.locator("#map").evaluate((root) => {
      const labels = [...root.querySelectorAll<SVGTextElement>("[data-layer='core'] text, [data-layer='inner'] text, [data-layer='rim'] text")].map((t) => ({ t, b: t.getBBox() }));
      const out: string[] = [];
      for (const p of root.querySelectorAll<SVGPathElement>(".cap-system-map-edge")) {
        const len = p.getTotalLength();
        for (let d = 0; d <= len; d += 2) {
          const { x, y } = p.getPointAtLength(d);
          const hit = labels.find(({ b }) => x > b.x && x < b.x + b.width && y > b.y && y < b.y + b.height);
          if (hit) {
            out.push(`${p.dataset.from} to ${p.dataset.to} over "${hit.t.textContent}"`);
            break;
          }
        }
      }
      return out;
    });
    expect(crossings).toEqual([]);
    expect(await page.locator("#map .cap-system-map-edge").count()).toBeGreaterThan(5);

    // With Carrel's lines drawn, what is on top at the middle of every label is the label's
    // capsomer, never a line.
    await tile(page, "map", "carrel").click();
    await expect(page.locator("#map .cap-system-map-edge[data-on]")).toHaveCount(4);
    await expect(tile(page, "map", "site")).toHaveAttribute("data-linked", "");
    // elementFromPoint skips what takes no pointer, and the lines and labels take none, so
    // for the probe they take it, and the answer is which of them is painted on top.
    const covered = await page.locator("#map").evaluate((root) => {
      const probe = document.createElement("style");
      probe.textContent = "#map .cap-system-map-edge, #map .cap-system-map-tile * { pointer-events: auto !important; }";
      document.head.append(probe);
      const out = [...root.querySelectorAll<SVGTextElement>("[data-layer='core'] text, [data-layer='inner'] text, [data-layer='rim'] text")]
        .filter((t) => {
          t.scrollIntoView({ block: "center" });
          const r = t.getBoundingClientRect();
          const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return !top || !t.closest(".cap-system-map-tile")!.contains(top);
        })
        .map((t) => t.textContent);
      probe.remove();
      return out;
    });
    expect(covered).toEqual([]);
  });

  test("inside: the faded rim shows its shapes and no text", async ({ page }) => {
    const rimText = () => page.locator("#map [data-layer='rim'] text").evaluateAll((els) => els.filter((e) => getComputedStyle(e).visibility === "visible").length);
    // The control: at rest the rim's names are there to see.
    expect(await rimText()).toBeGreaterThan(5);
    await tile(page, "map", "capsid").click();
    await tile(page, "map", "capsid").click();
    await expect(page.locator("#map")).toHaveAttribute("data-entered", "");
    expect(await rimText()).toBe(0);
    await expect(page.locator("#map [data-layer='rim'] polygon").first()).toBeVisible();
  });

  test("behaviour: the plain map shows the list as columns and hides the drawing", async ({ page }) => {
    await page.locator("#map").getByRole("button", { name: "Plain map" }).click();
    await expect(page.locator("#map")).toHaveAttribute("data-view", "plain");
    await expect(page.locator("#map .cap-system-map-stage")).toBeHidden();
    await expect(page.locator("#map .cap-system-map-list")).toHaveAttribute("open", "");
    await expect(page.locator("#map").getByRole("button", { name: "Plain map" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#map").getByRole("heading", { name: "Shared parts" })).toBeVisible();
  });

  test("behaviour: going inside animates, and with reduced motion runs no animation", async ({ page }) => {
    // The control: without the preference the layers do move, so a count of 0 below is
    // the preference at work and not a test that cannot see an animation.
    await tile(page, "map", "capsid").click();
    await tile(page, "map", "capsid").click();
    expect(await page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
    await page.keyboard.press("Escape");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(600);
    // Stepping out leaves the core chosen, so one click goes back in.
    await tile(page, "map", "capsid").click();
    await expect(page.locator("#map")).toHaveAttribute("data-entered", "");
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test("behaviour: delivered with no script, the drawing is one named picture and the list is open", async ({ page }) => {
    await expect(page.getByRole("img", { name: /The family, no script: 16 systems in rings/ })).toBeAttached();
    await expect(page.locator("#map-plain-html .cap-system-map-list")).toHaveAttribute("open", "");
    await expect(page.locator("#map-plain-html .cap-system-map-tile[role='button']")).toHaveCount(0);
    await expect(page.locator("#map-plain-html .cap-system-map-views")).toBeHidden();
  });
  for (const [label, size] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 390, height: 844 }]] as const) {
    test(`layout: the detail line keeps its height when a system is chosen, entered and left (${label}, with a host's unlayered CSS)`, async ({ page }) => {
      await page.setViewportSize(size);
      // A host's ordinary unlayered CSS beats layered CSS, so the height has to hold against it.
      await page.addStyleTag({ content: ".cap-system-map-detail { min-height: 0; height: auto; block-size: auto; overflow: visible; }" });
      const detail = page.locator("#map .cap-system-map-detail");
      const height = async () => (await detail.boundingBox())!.height;
      const rest = await height();
      const below = () => page.locator("#map .cap-system-map-list").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      const top = await below();
      for (const id of ["carrel", "fieldnotes", "capsid", "site-runtime"]) {
        await tile(page, "map", id).click();
        expect(await height(), `after choosing ${id}`).toBe(rest);
        expect(await below(), `the list below, after choosing ${id}`).toBe(top);
      }
      await tile(page, "map", "capsid").click();
      await tile(page, "map", "capsid").click();
      await expect(page.locator("#map")).toHaveAttribute("data-entered", "");
      expect(await height(), "inside").toBe(rest);
      expect(await below(), "the list below, inside").toBe(top);
      await page.keyboard.press("Escape");
      expect(await height(), "stepped out").toBe(rest);
      expect(await below(), "the list below, stepped out").toBe(top);
    });
  }

  test("inside: the parts outside the core sit outside its boundary, and are counted apart", async ({ page }) => {
    const reach = await page.locator("#map-inside [data-layer='inside']").evaluate((svg) => {
      const r = (svg.querySelector(".cap-system-map-boundary") as SVGCircleElement).r.baseVal.value;
      return [...svg.querySelectorAll<SVGGElement>(".cap-system-map-box[data-external]")].map((g) => {
        const b = g.querySelector("rect")!.getBBox();
        const nx = Math.max(0, b.x, -(b.x + b.width));
        const ny = Math.max(0, b.y, -(b.y + b.height));
        return { name: g.textContent, outside: Math.hypot(nx, ny) - r };
      });
    });
    expect(reach.map((b) => b.name)).toEqual(["AgentsSessions", "GitHubRepos, CI"]);
    for (const b of reach) expect(b.outside, `${b.name} reaches inside the boundary`).toBeGreaterThan(0);
    await expect(page.locator("#map-inside .cap-system-map-detail-text")).toHaveText("6 parts, 2 outside it, with the systems around it at the rim.");
    await expect(page.locator("#map-inside [data-layer='inside']")).toHaveAttribute("aria-label", /Agents, GitHub\.$/);
  });

  test("keyboard: Play starts a flow; Next, Back, the arrows and the number keys step it; Escape stops it, then steps out", async ({ page }) => {
    const map = page.locator("#map");
    const text = map.locator(".cap-system-map-detail-text");
    const steps: Array<{ id: string | null; step: number }> = [];
    await page.exposeFunction("noteStep", (d: { id: string | null; step: number }) => steps.push(d));
    await map.evaluate((el) => el.addEventListener("cap:system-map-flow", (e) => (window as unknown as { noteStep: (d: unknown) => void }).noteStep((e as CustomEvent).detail)));
    await tile(page, "map", "capsid").click();
    await tile(page, "map", "capsid").click();
    await map.getByRole("button", { name: "Play: A job's life" }).click();
    await expect(map).toHaveAttribute("data-flow", "job-life");
    await expect(text).toHaveText("Step 1 of 7. Posted: a session posts a job, and the Worker stores it.");
    await expect(map.getByRole("button", { name: "Next" })).toBeFocused();
    await expect(map.getByRole("button", { name: "Back" })).toBeDisabled();
    await expect(map.locator(".cap-system-map-wire[data-on]")).toHaveCount(1);
    await expect(map.locator(".cap-system-map-wire[data-on]")).toHaveAttribute("data-to", "capsid-agents");
    await expect(map.locator(".cap-system-map-box[data-lit]")).toHaveAttribute("data-id", "capsid-db");
    await expect(map.locator(".cap-system-map-box[data-at]")).toHaveAttribute("data-id", "capsid-worker");
    await page.keyboard.press("Enter");
    await expect(text).toContainText("Step 2 of 7.");
    await page.keyboard.press("ArrowRight");
    await expect(text).toContainText("Step 3 of 7.");
    await page.keyboard.press("7");
    await expect(text).toHaveText("Step 7 of 7. Deployed: GitHub deploys the Worker.");
    await expect(map.getByRole("button", { name: "Next" })).toBeDisabled();
    await expect(map.getByRole("button", { name: "Back" })).toBeFocused();
    await expect(map.locator(".cap-system-map-box[data-lit]")).toHaveCount(0);
    await page.keyboard.press("ArrowLeft");
    await expect(text).toContainText("Step 6 of 7.");
    await page.keyboard.press("9");
    await expect(text).toContainText("Step 6 of 7.");
    // A browser's own shortcuts stay the browser's.
    await page.keyboard.press("Alt+ArrowLeft");
    await page.keyboard.press("Shift+ArrowRight");
    await expect(text).toContainText("Step 6 of 7.");
    await page.keyboard.press("Escape");
    await expect(map).not.toHaveAttribute("data-flow");
    await expect(map).toHaveAttribute("data-entered", "");
    await expect(map.locator(".cap-system-map-wire[data-on], .cap-system-map-box[data-lit], .cap-system-map-box[data-at]")).toHaveCount(0);
    await expect(map.getByRole("button", { name: "Play: A job's life" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(map).not.toHaveAttribute("data-entered", "");
    expect(steps).toEqual([1, 2, 3, 7, 6, 0].map((step) => ({ id: step ? "job-life" : null, step })));
  });

  test("behaviour: the token travels the step's line and stops clear of every name; with reduced motion it jumps", async ({ page }) => {
    const map = page.locator("#map-flow");
    const tokenOnName = () =>
      map.evaluate((root) => {
        const t = root.querySelector<SVGCircleElement>(".cap-system-map-token")!.getBoundingClientRect();
        const [cx, cy] = [t.x + t.width / 2, t.y + t.height / 2];
        return [...root.querySelectorAll(".cap-system-map-box text")].filter((n) => {
          const b = n.getBoundingClientRect();
          return cx > b.left && cx < b.right && cy > b.top && cy < b.bottom;
        }).length;
      });
    // The control: a step plays an animation on the token.
    await map.getByRole("button", { name: "Back" }).click();
    expect(await map.locator(".cap-system-map-token").evaluate((t) => t.getAnimations().length)).toBe(1);
    for (let n = 1; n <= 7; n++) {
      await page.keyboard.press(String(n));
      await page.waitForTimeout(800);
      expect(await tokenOnName(), `step ${n}`).toBe(0);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.keyboard.press("2");
    expect(await map.locator(".cap-system-map-token").evaluate((t) => t.getAnimations().length)).toBe(0);
    await expect(map.locator(".cap-system-map-detail-text")).toContainText("Step 2 of 7.");
  });

  test("behaviour: with no script, each flow is an open, ordered list of its steps", async ({ page }) => {
    const flows = page.locator("#map-plain-html .cap-system-map-flows");
    await expect(flows).toHaveAttribute("open", "");
    await expect(flows.getByRole("heading", { name: "A job's life" })).toBeVisible();
    await expect(flows.locator("ol > li")).toHaveCount(7);
    await expect(flows.locator("ol > li").first()).toHaveText("Posted: a session posts a job, and the Worker stores it.");
    // With script the step list closes, as the map's list does.
    await expect(page.locator("#map .cap-system-map-flows")).not.toHaveAttribute("open", "");
  });

  test("behaviour: leaving by any way stops the flow and says so, and the plain view opens the steps", async ({ page }) => {
    const map = page.locator("#map");
    const stops: unknown[] = [];
    await page.exposeFunction("noteStop", (d: unknown) => stops.push(d));
    await map.evaluate((el) => el.addEventListener("cap:system-map-flow", (e) => (e as CustomEvent).detail.id === null && (window as unknown as { noteStop: (d: unknown) => void }).noteStop((e as CustomEvent).detail)));
    await tile(page, "map", "capsid").click();
    await tile(page, "map", "capsid").click();
    await map.getByRole("button", { name: "Play: A job's life" }).click();
    await map.getByRole("button", { name: "Plain map" }).click();
    await expect(map).not.toHaveAttribute("data-flow");
    await expect(map.locator(".cap-system-map-flows")).toHaveAttribute("open", "");
    await expect.poll(() => stops.length).toBe(1);
    expect(stops[0]).toEqual({ id: null, step: 0 });
  });
});
