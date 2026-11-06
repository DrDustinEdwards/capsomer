// The theme switch's server half: a cookie the server cannot read must cost the default theme, never the page.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readThemeCookie, themeColorMeta, themeColorTags, themeCookie, themeScript } from "../../components/theme-switch/theme-server.ts";

test("readThemeCookie: the named cookie's choice; anything else, malformed encoding included, is no choice", () => {
  assert.equal(readThemeCookie("a=1; theme=dark; b=2"), "dark");
  assert.equal(readThemeCookie(new Request("https://example.com", { headers: { cookie: "fh_theme=light" } }), "fh_theme"), "light");
  for (const header of ["theme=system", "theme=%E0%A4%A", "xtheme=dark", "", null]) assert.equal(readThemeCookie(header), null, String(header));
});

test("themeCookie round-trips through readThemeCookie, and themeScript is the documented inline script", () => {
  assert.equal(readThemeCookie(themeCookie("light").split(";")[0]), "light");
  assert.equal(themeScript(), `try{var t=localStorage.getItem("cap-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`);
});

test("themeColorTags: one tag for a choice, a media pair without one; themeColorMeta is the same tags as HTML", () => {
  const ground = { light: "#fbf9ff", dark: "#0e0c12" };
  assert.deepEqual(themeColorTags("dark", ground), [{ name: "theme-color", content: "#0e0c12" }]);
  assert.deepEqual(themeColorTags(null, ground).map((t) => t.media), ["(prefers-color-scheme: light)", "(prefers-color-scheme: dark)"]);
  assert.equal(
    themeColorMeta(null, ground),
    '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fbf9ff"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0e0c12">',
  );
});
