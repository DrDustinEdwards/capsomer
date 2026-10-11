import { expect, test } from "@playwright/test";
import { expectContrast, expectNoAxeViolations, focused, nextPost, paintedContrast } from "./helpers.ts";

// The helpers capsomer/testing hands to apps, each checked on a page of its own so a change to
// one fails here, not first in an app's CI.

test.describe("paintedContrast", () => {
  test("accessibility: text is read against the first opaque background, translucent layers composited", async ({ page }) => {
    await page.setContent(`<body style="background:#fff"><div style="background:#000"><p id="t" style="color:#fff;margin:0">x</p></div>
      <div style="background:rgba(0,0,0,.5)"><p id="u" style="color:#000;margin:0">y</p></div></body>`);
    const white = await paintedContrast(page, "#t");
    expect(white?.fg).toBe("#ffffff");
    expect(white?.bg).toBe("#000000");
    expect(white?.ratio).toBeCloseTo(21, 0);
    // black on 50% black over white is #808080: 5.32:1
    const grey = await paintedContrast(page, "#u");
    expect(grey?.bg).toBe("#808080");
    expect(grey?.ratio).toBeCloseTo(5.32, 1);
  });

  test("accessibility: SVG text is read by its fill, on the shape drawn before it in its group", async ({ page }) => {
    await page.setContent(`<body style="background:#fff;color:#000"><svg width="100" height="40"><g>
      <rect width="100" height="40" style="fill:#000"/><text id="s" x="4" y="20" style="fill:#fff">x</text></g></svg></body>`);
    const r = await paintedContrast(page, "#s");
    expect(r?.fg).toBe("#ffffff");
    expect(r?.bg).toBe("#000000");
    expect(r?.ratio).toBeCloseTo(21, 0);
  });

  test("accessibility: a border is read against the parent's background, and a missing element is null", async ({ page }) => {
    await page.setContent(`<body style="background:#fff"><div id="b" style="border:2px solid #777;background:#000;width:20px;height:20px"></div></body>`);
    const r = await paintedContrast(page, "#b", "border");
    // against the white around the box, not the box's own black fill
    expect(r?.fg).toBe("#777777");
    expect(r?.bg).toBe("#ffffff");
    expect(r?.ratio).toBeCloseTo(4.48, 1);
    expect(await paintedContrast(page, "#nope")).toBeNull();
  });
});

test.describe("expectContrast", () => {
  test("accessibility: passes at the bar, fails below it, and fails on a selector that matches nothing", async ({ page }) => {
    await page.setContent(`<body style="background:#fff"><p id="ok" style="color:#000">a</p><p id="low" style="color:#aaa">b</p></body>`);
    await expectContrast(page, [{ sel: "#ok", what: "body text" }]);
    await expect(expectContrast(page, [{ sel: "#low", what: "pale text" }])).rejects.toThrow(/pale text: #aaaaaa on #ffffff is 2\.3\d:1, needs 4\.5:1/);
    await expect(expectContrast(page, [{ sel: "#nope", what: "missing" }])).rejects.toThrow(/missing \(#nope\) is on the page/);
  });
});

test.describe("expectNoAxeViolations", () => {
  test("accessibility: a clean page passes and an unlabelled button fails, naming the rule", async ({ page }) => {
    await page.setContent(`<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1><button id="b">Save</button></main></body></html>`);
    await expectNoAxeViolations(page);
    await page.evaluate(() => (document.getElementById("b")!.textContent = ""));
    await expect(expectNoAxeViolations(page)).rejects.toThrow(/button-name/);
  });

  test("accessibility: include limits the scan to a region", async ({ page }) => {
    await page.setContent(`<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1><div id="a"><button>Ok</button></div><div id="z"><button></button></div></main></body></html>`);
    await expectNoAxeViolations(page, "#a");
    await expect(expectNoAxeViolations(page, "#z")).rejects.toThrow(/button-name/);
  });

  test("accessibility: baseUi leaves out Base UI's focus guards and iframes, and nothing else", async ({ page }) => {
    await page.setContent(`<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1>
      <span data-base-ui-focus-guard tabindex="0" aria-hidden="true"></span></main></body></html>`);
    await expect(expectNoAxeViolations(page)).rejects.toThrow(/aria-hidden-focus/);
    await expectNoAxeViolations(page, undefined, { baseUi: true });
    await page.evaluate(() => document.querySelector("main")!.insertAdjacentHTML("beforeend", `<button></button>`));
    await expect(expectNoAxeViolations(page, undefined, { baseUi: true })).rejects.toThrow(/button-name/);
  });
});

test.describe("focused and nextPost", () => {
  test("behaviour: focused describes the active element, or body", async ({ page }) => {
    await page.setContent(`<button id="go" aria-label="Go now">Go</button><a href="#">Link text</a>`);
    expect(await focused(page)).toBe("body");
    await page.focus("#go");
    expect(await focused(page)).toBe(`button#go "Go now"`);
    await page.focus("a");
    expect(await focused(page)).toBe(`a "Link text"`);
  });

  test("behaviour: nextPost stops the next submit and returns method, encoding and fields, a file by name", async ({ page }) => {
    await page.route("http://helpers.test/**", (route) => route.fulfill({ contentType: "text/html", body: "<p>posted</p>" }));
    await page.goto("http://helpers.test/form");
    await page.setContent(`<div id="root"><form method="post" enctype="multipart/form-data" action="http://helpers.test/x">
      <input name="a" value="1"><input name="a" value="2"><input type="file" name="f">
      <button name="intent" value="save">Save</button></form></div>`);
    await page.setInputFiles("input[type=file]", { name: "n.txt", mimeType: "text/plain", buffer: Buffer.from("hi") });
    await page.evaluate(() => ((window as unknown as { kept: boolean }).kept = true));
    const posted = nextPost(page, "#root form");
    await page.click("button");
    expect(await posted).toEqual({ method: "post", enctype: "multipart/form-data", fields: { a: ["1", "2"], f: ["file:n.txt"], intent: ["save"] } });
    // the submit was stopped, so this page, and what the script set on it, is still here
    await expect(page.locator("#root")).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { kept?: boolean }).kept)).toBe(true);
  });
});
