// The rich text field's sanitizer: what a server stores. Each case is a way stored text could
// carry more than the allowed inline tags.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isEmptyRichText,
  richTextPlain,
  richTextWords,
  sanitizeRichText,
} from "../../components/rich-text-field/rich-text-field.ts";

const BODY = ["em", "sup", "sub"];
const body = (s) => sanitizeRichText(s, BODY);
const title = (s) => sanitizeRichText(s, ["em"]);

test("only the allowed tags stay, bare, and the text of the rest is kept", () => {
  assert.equal(
    sanitizeRichText(
      '<p class="x"><em onclick="a()">A</em> <b>B</b> <i>C</i><img src=x onerror=y></p>',
      BODY,
    ),
    "<em>A</em> B <em>C</em>",
  );
  assert.equal(sanitizeRichText("<em>A</em>", ["sup"]), "A");
});

test("script and style text goes with them; a stray < and & are text", () => {
  assert.equal(sanitizeRichText("x<script>alert(1)</script><style>p{}</style>y", BODY), "xy");
  assert.equal(sanitizeRichText("a < b & c", BODY), "a &lt; b &amp; c");
});

test("tags come out balanced, whatever order they close in", () => {
  assert.equal(
    sanitizeRichText("<em>a<sup>b</em>c</sup>", BODY),
    "<em>a<sup>b</sup></em><sup>c</sup>",
  );
  assert.equal(sanitizeRichText("<em>open", BODY), "<em>open</em>");
  assert.equal(sanitizeRichText("</em>x<em></em>", BODY), "x");
});

test("references are read once and written again as text; control characters go", () => {
  assert.equal(
    sanitizeRichText("&amp;lt; &deg;C &#x3b1; &unknown; a\u0000b", BODY),
    "&amp;lt; °C α &amp;unknown; ab",
  );
  // Stored again, the value is the same: sanitizing is idempotent.
  const once = sanitizeRichText("4 &deg;C &lt;em&gt;", BODY);
  assert.equal(sanitizeRichText(once, BODY), once);
});

test("plain text, words and empty read through the tags", () => {
  assert.equal(richTextPlain("<em>a</em>&nbsp;b &amp; c"), "a b & c");
  assert.equal(richTextWords("<em>one</em> two<sup>3</sup>"), 2);
  assert.equal(isEmptyRichText("<em> </em>&nbsp;"), true);
});

// From txasm, where every abstract title and body is stored through this and shown as HTML on about 20 pages.
test("stored abstract HTML keeps em, sup and sub and nothing that can run", () => {
  const hostile = [
    "<script>alert(1)</script>",
    "<SCRIPT SRC=//example.com/x.js></SCRIPT>",
    "<img src=x onerror=alert(1)>",
    '<img src="a>b" onerror=alert(1)>',
    "<em onclick=alert(1)>hi</em>",
    "<em/onmouseover=alert(1)>hi</em>",
    '<a href="javascript:alert(1)">x</a>',
    '<a href="&#106;avascript:alert(1)">x</a>',
    "<svg><script>alert(1)</script></svg>",
    "<svg/onload=alert(1)>",
    "<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>",
    "<style>body{background:url(javascript:alert(1))}</style>",
    '<sup style="background:url(javascript:alert(1))">2</sup>',
    "<iframe srcdoc='<script>alert(1)</script>'></iframe>",
    "<scr<script>ipt>alert(1)</script>",
    "<!--><img src=x onerror=alert(1)>-->",
    "<img src=x onerror=alert(1)",
    "\u0000<script>alert(1)</script>",
  ];
  for (const input of hostile) {
    for (const out of [body(input), title(input)]) {
      const tags = out.match(/<[^>]*>/g) ?? [];
      assert.ok(
        tags.every((t) => /^<\/?(em|sup|sub)>$/.test(t)),
        `${input} -> ${out}`,
      );
      assert.ok(!/<[a-z!/]/i.test(out.replace(/<\/?(em|sup|sub)>/g, "")), `${input} -> ${out}`);
    }
  }

  assert.equal(
    body(
      "<p>E. coli<em>  K-12</em> grew 10<sup>6</sup> CFU in H<sub>2</sub>O &amp; <b>LB</b> &lt;5 h</p>",
    ),
    "E. coli<em>  K-12</em> grew 10<sup>6</sup> CFU in H<sub>2</sub>O &amp; LB &lt;5 h",
  );
  assert.equal(title("<EM>Bacillus</EM> <sup>1</sup>"), "<em>Bacillus</em> 1");
  assert.equal(body("<em>open <sup>x</em> y"), "<em>open <sup>x</sup></em><sup> y</sup>");
});
