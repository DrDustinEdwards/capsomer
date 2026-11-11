// htmlToBlocks: the email body reader's tricky cases (entities, implied end tags, hidden content, links in sentences).
// Moved from Foxhound's test/email-shell-j02.test.ts with the reader in 0.92.0.
import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { htmlToBlocks } from "../../components/email/html-to-blocks.ts";

suite("htmlToBlocks keeps the sender's words and order", () => {
  test("a line break starts a new paragraph, and a real heading tag is a heading", () => {
    assert.deepEqual(htmlToBlocks(`<h1>Payment recovered.</h1><p>Thanks,<br />Acme</p>`), [
      { type: "heading", text: "Payment recovered." },
      { type: "paragraph", text: "Thanks," },
      { type: "paragraph", text: "Acme" },
    ]);
  });

  test("bold inside a sentence stays in the sentence", () => {
    assert.deepEqual(htmlToBlocks(`<p>Jane just paid <strong>$99.00</strong>.</p>`), [
      { type: "paragraph", text: "Jane just paid $99.00." },
    ]);
  });

  test("hidden content, script and comments never reach a block", () => {
    assert.deepEqual(
      htmlToBlocks(
        `<p>Seen</p><div style="display: none">Unseen</div><p aria-hidden="true">Nope</p><!-- note --><script>x()</script><style>p{}</style>`,
      ),
      [{ type: "paragraph", text: "Seen" }],
    );
  });

  test("table cells are paragraphs, and a cell's spans are kept apart", () => {
    assert.deepEqual(
      htmlToBlocks(
        `<table><tr><td>$12.00<span>Revenue recovered</span></td><td>50%<span>Recovery rate</span></td></tr></table>` +
          `<table><tr><td><span>Failed payments detected</span><span>4</span></td></tr></table>`,
      ),
      [
        { type: "paragraph", text: "$12.00 Revenue recovered" },
        { type: "paragraph", text: "50% Recovery rate" },
        { type: "paragraph", text: "Failed payments detected 4" },
      ],
    );
  });

  test("a whole small block is fine print", () => {
    assert.deepEqual(
      htmlToBlocks(`<p><small>If the button does not work:<br>https://x.test/a</small></p>`),
      [
        { type: "fine", text: "If the button does not work:" },
        { type: "fine", text: "https://x.test/a" },
      ],
    );
  });
});

suite("review fixes to the HTML reader", () => {
  test("fix 2: numeric and common named entities are decoded; unknown ones stay", () => {
    assert.deepEqual(
      htmlToBlocks(
        "<p>it&rsquo;s &lsquo;a&rsquo; &ldquo;b&rdquo; &mdash; &ndash; &hellip; &euro;1 &pound;2 &yen;3 " +
          "&copy; &reg; &trade; x&nbsp;y &bull; &middot; &laquo;q&raquo; 2&times;3 9&deg; 5&cent; &sect;4 &para; " +
          "&#8217;&#x2019;&#X2014; &madeup; &amp;</p>",
      ),
      [
        {
          type: "paragraph",
          text:
            "it\u2019s \u2018a\u2019 \u201cb\u201d \u2014 \u2013 \u2026 \u20ac1 \u00a32 \u00a53 " +
            "\u00a9 \u00ae \u2122 x y \u2022 \u00b7 \u00abq\u00bb 2\u00d73 9\u00b0 5\u00a2 \u00a74 \u00b6 " +
            "\u2019\u2019\u2014 &madeup; &",
        },
      ],
    );
  });

  test("fix 3: a hidden li, td or p is closed by a sibling or a parent end tag", () => {
    assert.deepEqual(htmlToBlocks(`<ul><li hidden>secret<li>Shown</ul>`), [
      { type: "paragraph", text: "Shown" },
    ]);
    assert.deepEqual(
      htmlToBlocks(`<ul><li hidden><ul><li>nested</li></ul>still hidden<li>Shown</ul>`),
      [{ type: "paragraph", text: "Shown" }],
    );
    assert.deepEqual(htmlToBlocks(`<table><tr><td hidden>s<td>Cell</tr></table>`), [
      { type: "paragraph", text: "Cell" },
    ]);
    assert.deepEqual(htmlToBlocks(`<div><p hidden>secret</div><p>After</p>`), [
      { type: "paragraph", text: "After" },
    ]);
    assert.deepEqual(htmlToBlocks(`<p hidden>secret<div>Block</div>`), [
      { type: "paragraph", text: "Block" },
    ]);
  });

  test("fix 3: a void or self-closing hidden element never opens a skip", () => {
    assert.deepEqual(
      htmlToBlocks(`<p><img hidden src="https://x.test/i.png" alt="">Still here</p>`),
      [{ type: "paragraph", text: "Still here" }],
    );
    assert.deepEqual(htmlToBlocks(`<p><span hidden />Still</p><p>Next</p>`), [
      { type: "paragraph", text: "Still" },
      { type: "paragraph", text: "Next" },
    ]);
  });

  test("fix 6: a second link opening inside the first keeps the first link's words", () => {
    assert.deepEqual(
      htmlToBlocks(
        `<p><a href="https://x.test/a">First <a href="https://x.test/b">Second</a> end</p>`,
      ),
      [
        { type: "paragraph", text: "First Second end" },
        { type: "button", label: "First", url: "https://x.test/a" },
        { type: "button", label: "Second", url: "https://x.test/b" },
      ],
    );
  });
});
