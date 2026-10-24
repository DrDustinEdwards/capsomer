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

  test("inside: the inner rings fold away, the rim stays behind as faded shapes with no names, and the circle fills the stage", async ({ page }) => {
    const shown = (layer: string) => page.locator(`#map [data-layer='${layer}']`).evaluate((e) => getComputedStyle(e).visibility === "visible");
    const rim = () =>
      page.locator("#map [data-layer='rim']").evaluate((e) => ({
        opacity: Number(getComputedStyle(e).opacity),
        names: [...e.querySelectorAll("text")].filter((t) => getComputedStyle(t).visibility === "visible").length,
      }));
    // The control: at rest the rim is there to see, names and all.
    expect(await shown("rim")).toBe(true);
    expect((await rim()).names).toBeGreaterThan(0);
    await tile(page, "map", "capsid").click();
    await tile(page, "map", "capsid").click();
    await expect(page.locator("#map")).toHaveAttribute("data-entered", "");
    await expect.poll(() => shown("inner")).toBe(false);
    await expect.poll(async () => (await rim()).opacity).toBeLessThan(0.3);
    expect(await shown("rim")).toBe(true);
    expect((await rim()).opacity).toBeGreaterThan(0);
    expect((await rim()).names).toBe(0);
    const fill = await page.locator("#map").evaluate((root) => {
      const stage = root.querySelector(".cap-system-map-stage")!.getBoundingClientRect();
      const b = root.querySelector(".cap-system-map-boundary")!.getBoundingClientRect();
      return (b.width * b.height) / (stage.width * stage.height);
    });
    expect(fill, "the boundary's share of the stage").toBeGreaterThan(0.6);
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

  test("behaviour: with circles, one tap zooms into any system, its rim zooms on, and Back, Escape or a tap outside returns", async ({ page }) => {
    const map = page.locator("#map-circles");
    await tile(page, "map-circles", "carrel").click();
    await expect(map).toHaveAttribute("data-zoom", "carrel");
    await expect(map.getByRole("img", { name: /^Carrel: no parts\. Connects to .*Capsid/ })).toBeVisible();
    await expect(map.locator("[data-layer='inside']:not([data-shown])").first()).toBeHidden();
    const out = map.getByRole("button", { name: "Back to all systems" });
    await expect(out).toBeFocused();
    await map.locator("[data-shown] .cap-system-map-rim[data-goto='capsid']").click();
    await expect(map).toHaveAttribute("data-zoom", "capsid");
    await expect(map.getByRole("img", { name: /^Capsid: MCP Worker, Portal, .* inside\. Outside: Agents and GitHub\./ })).toBeVisible();
    // The core's circle plays its flows.
    await map.getByRole("button", { name: "Play: A job's life" }).click();
    await expect(map).toHaveAttribute("data-flow", "job-life");
    await page.keyboard.press("Escape");
    await expect(map).not.toHaveAttribute("data-flow", /./);
    await page.keyboard.press("Escape");
    await expect(map).not.toHaveAttribute("data-entered", "");
    expect(await focusedId(page)).toBe("capsid");
    await tile(page, "map-circles", "site").click();
    await out.click();
    await expect(map).not.toHaveAttribute("data-entered", "");
    await tile(page, "map-circles", "site").click();
    const box = (await map.locator(".cap-system-map-stage").boundingBox())!;
    await page.mouse.click(box.x + 4, box.y + 4);
    await expect(map).not.toHaveAttribute("data-entered", "");
    await expect(out).toBeHidden();
  });

  test("behaviour: with circles, a chosen system is delivered zoomed into, its lines on", async ({ page }) => {
    const map = page.locator("#map-zoomed");
    await expect(map).toHaveAttribute("data-zoom", "carrel");
    await expect(map.locator("[data-layer='inside'][data-system='carrel']")).toBeVisible();
    await expect(tile(page, "map-zoomed", "carrel")).toHaveAttribute("aria-pressed", "true");
    await expect(map.locator(".cap-system-map-edge[data-on]")).not.toHaveCount(0);
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
    await expect(page.locator("#map-inside .cap-system-map-box[data-external]")).toHaveText(["AgentsSessions", "GitHubRepos, CI"]);
    await expect(page.locator("#map-inside .cap-system-map-detail-text")).toHaveText("6 parts inside, 2 outside it.");
    await expect(page.locator("#map-inside [data-layer='inside']")).toHaveAttribute("aria-label", /Agents, GitHub\.$/);
  });

  test("accessibility: the panel's headings are in the page's own face", async ({ page }) => {
    const faces = await page.evaluate(() => {
      const body = getComputedStyle(document.body).fontFamily;
      const of = (sel: string) => getComputedStyle(document.querySelector(sel)!).fontFamily;
      return { body, inside: of("#map-inside .cap-system-map-detail-name"), step: of("#map-flow .cap-system-map-detail-name"), flow: of("#map-flow .cap-system-map-flow-name") };
    });
    expect(faces.body).not.toMatch(/Serif|Georgia|(^|, )serif$/);
    expect(faces).toEqual({ body: faces.body, inside: faces.body, step: faces.body, flow: faces.body });
  });

  test("accessibility: in forced colours every part is the canvas with a text-coloured edge, stores and outside parts too", async ({ page }) => {
    const colours = () =>
      page.locator("#map-flow").evaluate((root) => {
        const probe = document.createElement("span");
        probe.style.cssText = "color: Canvas; background: CanvasText";
        document.body.append(probe);
        const canvas = getComputedStyle(probe).color;
        const text = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const rects = [...root.querySelectorAll<SVGRectElement>(".cap-system-map-box rect")].map((r) => ({ id: r.parentElement!.dataset.id, marked: r.parentElement!.matches("[data-lit], [data-at]"), fill: getComputedStyle(r).fill, stroke: getComputedStyle(r).stroke }));
        const wire = getComputedStyle(root.querySelector(".cap-system-map-wire:not([data-on])")!).stroke;
        return { canvas, text, rects, wire };
      });
    // The control: in ordinary colours a store keeps its tint.
    const plain = await colours();
    expect(plain.rects.find((r) => r.id === "capsid-db")!.fill).not.toBe(plain.canvas);
    await page.emulateMedia({ forcedColors: "active" });
    const forced = await colours();
    for (const r of forced.rects) {
      expect(r.fill, `${r.id}'s fill`).toBe(forced.canvas);
      if (!r.marked) expect(r.stroke, `${r.id}'s edge`).toBe(forced.text);
    }
    expect(forced.wire).toBe(forced.text);
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

  // The drawing inside the core at the size a reader sees it, desktop and phone: every rule of
  // the seat's rulings on capsomer#64, measured in screen pixels from the drawn lines.
  for (const [width, height] of [[1280, 900], [320, 700]] as const) {
    test(`lines: inside the core at ${width} px, every part and line keeps clear of the others`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      const drawn = await page.locator("#map-inside [data-layer='inside']").evaluate((svg: SVGSVGElement) => {
        type P = [number, number];
        const k = svg.getScreenCTM()!.a;
        const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
        const len = (v: P) => Math.hypot(v[0], v[1]);
        const ptSeg = (p: P, a: P, b: P) => {
          const ab = sub(b, a);
          const l2 = ab[0] ** 2 + ab[1] ** 2;
          const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2)) : 0;
          return len(sub(p, [a[0] + t * ab[0], a[1] + t * ab[1]]));
        };
        const cross = (a: P, b: P, c: P, d: P): P | null => {
          const r = sub(b, a);
          const s = sub(d, c);
          const den = r[0] * s[1] - r[1] * s[0];
          if (Math.abs(den) < 1e-9) return null;
          const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
          const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
          return t > 0 && t < 1 && u > 0 && u < 1 ? [a[0] + t * r[0], a[1] + t * r[1]] : null;
        };
        const angle = (a: P, b: P, c: P, d: P) => {
          const u = sub(b, a);
          const v = sub(d, c);
          return (Math.acos(Math.min(1, Math.abs(u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v)))) * 180) / Math.PI;
        };
        const rectDist = (p: P, r: DOMRect) => len([Math.max(r.x - p[0], 0, p[0] - r.x - r.width), Math.max(r.y - p[1], 0, p[1] - r.y - r.height)]);
        const inRect = (p: P, r: DOMRect, g = 0) => p[0] > r.x - g && p[0] < r.x + r.width + g && p[1] > r.y - g && p[1] < r.y + r.height + g;
        const xy = (w: SVGPathElement, d: number): P => {
          const { x, y } = w.getPointAtLength(d);
          return [x, y];
        };
        const ring = svg.querySelector<SVGCircleElement>(".cap-system-map-boundary")!;
        const [cx, cy, r] = [ring.cx.baseVal.value, ring.cy.baseVal.value, ring.r.baseVal.value];
        const label = svg.querySelector<SVGTextElement>(".cap-system-map-inside-title")!.getBBox();
        const boxes = [...svg.querySelectorAll<SVGGElement>(".cap-system-map-box")].map((g) => ({ id: g.dataset.id!, external: g.hasAttribute("data-external"), b: g.querySelector("rect")!.getBBox() }));
        const boxOf = (id: string) => boxes.find((b) => b.id === id)!.b;
        // A line as a reader sees it: from where it leaves one box to where it meets the other.
        const wires = [...svg.querySelectorAll<SVGPathElement>(".cap-system-map-wire")].map((w) => {
          const route = w.dataset.route!.split(" ").map((p) => p.split(",").map(Number) as P);
          const total = w.getTotalLength();
          const ends = [w.dataset.from!, w.dataset.to!];
          let first = 0;
          let last = total;
          for (let d = 0; d <= total && ends.some((id) => inRect(xy(w, d), boxOf(id))); d += 0.5) first = d;
          for (let d = total; d >= 0 && ends.some((id) => inRect(xy(w, d), boxOf(id))); d -= 0.5) last = d;
          return { name: `${w.dataset.from}-${w.dataset.to}`, ends, route, segs: route.slice(1).map((q, i) => [route[i]!, q] as [P, P]), shown: [xy(w, first), xy(w, last)], length: last - first };
        });
        const out: Record<string, string[]> = { boundary: [], box: [], label: [], junction: [], beside: [], bend: [] };
        let least = Number.POSITIVE_INFINITY;
        // The boxes: inside the boundary, or outside it, with clear space; the name inside it.
        for (const { id, external, b } of boxes) {
          // Inside: the farthest corner's distance from the circle; outside, the nearest point's.
          const corners: P[] = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]];
          const gap = external ? rectDist([cx, cy], b) - r : r - Math.max(...corners.map(([x, y]) => len([x - cx, y - cy])));
          if (gap * k <= 5) out.boundary!.push(`${id}: ${(gap * k).toFixed(1)} px from the boundary`);
          if (!(b.x + b.width < label.x || label.x + label.width < b.x || b.y + b.height < label.y || label.y + label.height < b.y)) out.boundary!.push(`${id} covers the name`);
        }
        for (const w of wires) {
          // Sampled every drawn pixel along the line: its distance from every box but its ends.
          const path = svg.querySelector<SVGPathElement>(`.cap-system-map-wire[data-from="${w.ends[0]}"][data-to="${w.ends[1]}"]`)!;
          for (let d = 0; d <= w.length; d += 1 / k) {
            const { x, y } = path.getPointAtLength(d);
            for (const o of boxes) {
              if (w.ends.includes(o.id)) {
                if (inRect([x, y], o.b)) out.box!.push(`${w.name} enters ${o.id}`);
                continue;
              }
              const gap = rectDist([x, y], o.b) * k;
              least = Math.min(least, gap);
              if (gap <= 5) out.box!.push(`${w.name} passes ${gap.toFixed(1)} px from ${o.id}`);
            }
            if (inRect([x, y], label, 2 / k)) out.label!.push(`${w.name} crosses the boundary's name`);
          }
          for (const v of wires) {
            if (v === w) continue;
            const vEnds = v.shown;
            const vShort = v.length < 90;
            for (const [p, q] of w.segs) {
              for (const [c, d] of v.segs) {
                const x = cross(p, q, c, d);
                if (x && (vShort || vEnds.some((e) => len(sub(x, e)) * k < 10))) out.junction!.push(`${w.name} crosses ${v.name}${vShort ? ", a short line" : " by its end"}`);
                if (!x && angle(p, q, c, d) < 20) {
                  const near = Math.min(ptSeg(p, c, d), ptSeg(q, c, d), ptSeg(c, p, q), ptSeg(d, p, q)) * k;
                  if (near < 8) out.beside!.push(`${w.name} runs ${near.toFixed(1)} px beside ${v.name}`);
                }
              }
            }
            for (const bend of w.route.slice(1, -1)) {
              const near = Math.min(...v.segs.map(([c, d]) => ptSeg(bend, c, d))) * k;
              if (near < 10) out.bend!.push(`a bend in ${w.name} sits ${near.toFixed(1)} px from ${v.name}`);
            }
          }
        }
        return { out: Object.fromEntries(Object.entries(out).map(([r, l]) => [r, [...new Set(l)]])), least, wires: wires.length, bent: wires.filter((w) => w.route.length > 2).length };
      });
      for (const [rule, list] of Object.entries(drawn.out)) expect.soft(list, rule).toEqual([]);
      expect(drawn.least, "the nearest a line comes to a box it does not end at, in px").toBeGreaterThan(5);
      expect(drawn.wires).toBeGreaterThanOrEqual(8);
      expect(drawn.bent).toBeGreaterThan(0);
    });
  }
});
