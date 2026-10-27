// The search page's script (site/search.ts writes the page): reads ?q=, loads the index the build
// wrote (/search.json) and lists what Prelum's staticSearch ranks, with the count said aloud. The
// query's words are marked in each result, as people scan results for them (NN/g), and the header's
// box shows the query too, so the page never holds two boxes that disagree.
import "./home-main.ts";
import { searchWords, staticSearch, type StaticSearchIndex } from "@drdustinedwards/site-helpers/search";

const input = document.querySelector<HTMLInputElement>("#search-q");
const status = document.querySelector<HTMLElement>("#search-status");
const list = document.querySelector<HTMLOListElement>("#search-results");
const query = new URLSearchParams(location.search).get("q")?.trim() ?? "";
const words = searchWords(query);

/** The text with each word that starts with one of the query's words in a <mark>, built as nodes, never as HTML. */
function marked(text: string): Node[] {
  const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const out: Node[] = [];
  for (const part of text.split(/([\p{L}\p{N}]+)/u)) {
    if (!part) continue;
    if (/[\p{L}\p{N}]/u.test(part) && words.some((w) => fold(part).startsWith(w))) {
      const m = document.createElement("mark");
      m.textContent = part;
      out.push(m);
    } else out.push(document.createTextNode(part));
  }
  return out;
}

function item(r: ReturnType<typeof staticSearch>[number]): HTMLLIElement {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = r.url;
  a.append(...marked(r.heading ? `${r.title}: ${r.heading}` : r.title));
  const p = document.createElement("p");
  p.append(...marked(r.snippet));
  li.append(a, p);
  return li;
}

const headerBox = document.querySelector<HTMLInputElement>(".cap-site-header-search input");
if (headerBox) headerBox.value = query;

if (input && status && list) {
  input.value = query;
  if (!query) {
    status.textContent = "Type a word: a component, a token or a rule.";
    input.focus();
  } else {
    status.textContent = "Searching…";
    fetch("/search.json")
      .then((r) => (r.ok ? (r.json() as Promise<StaticSearchIndex>) : Promise.reject(new Error(String(r.status)))))
      .then((index) => {
        const results = staticSearch(index, query);
        list.replaceChildren(...results.map(item));
        if (results.length) status.textContent = `${results.length} ${results.length === 1 ? "result" : "results"} for “${query}”`;
        else {
          const all = document.createElement("a");
          all.href = "/#components";
          all.textContent = "every component";
          status.replaceChildren(`Nothing matches “${query}”. Try fewer words, or browse `, all, ".");
        }
      })
      .catch(() => {
        status.textContent = "Search could not load. Every component is listed on the front page.";
      });
  }
}
