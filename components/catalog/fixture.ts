// A collection for the catalog's specimen and its spec: a small article library, big enough to filter, search,
// sort and page. It is data, not copy: the names are made up for the specimen.
import { defineCatalog } from "./catalog-core.ts";

export interface Article {
  id: string;
  title: string;
  kind: "guide" | "report" | "note";
  topics: string[];
  regions: string[];
  size: number | null;
  updated: string;
}

const TOPICS = ["billing", "pricing", "onboarding", "security", "releases", "support", "design", "accounts"];
const REGIONS = ["north", "south", "east", "west"];

export const ARTICLES: Article[] = Array.from({ length: 27 }, (_, i) => {
  const kind = i % 9 === 8 ? "note" : i % 5 === 4 ? "report" : "guide";
  return {
    id: `a${String(i + 1).padStart(2, "0")}`,
    title: `${["Billing", "Pricing", "Onboarding", "Security", "Release", "Support", "Design", "Account", "Search"][i % 9]} ${["basics", "checklist", "overview", "review", "notes", "walkthrough", "update"][i % 7]} ${i + 1}`,
    kind,
    topics: [TOPICS[i % TOPICS.length] as string, ...(i % 4 === 0 ? [TOPICS[(i + 3) % TOPICS.length] as string] : [])],
    regions: i % 3 === 0 ? [] : [REGIONS[i % REGIONS.length] as string],
    size: kind === "guide" && i % 2 === 0 ? 300 + i * 11 : null,
    updated: `2026-0${(i % 9) + 1}-${String((i * 3) % 27 + 1).padStart(2, "0")}`,
  };
});

export const articleCatalog = defineCatalog<Article>({
  id: "articles",
  noun: ["article", "articles"],
  basePath: "/components/catalog/states.html",
  itemKey: (a) => a.id,
  defaultSort: "-updated",
  pageSize: 10,
  fields: [
    { key: "title", label: "Name", value: (a) => a.title, search: 3, sort: true, column: { header: "Name" } },
    { key: "kind", label: "Kind", value: (a) => a.kind, facet: { general: true, kind: "one", order: ["guide", "report", "note"] }, column: { header: "Kind" } },
    { key: "topic", label: "Topic", value: (a) => a.topics, search: 2, facet: { general: true, order: "alpha" }, column: { header: "Topic", drop: 1 } },
    { key: "region", label: "Region", value: (a) => a.regions, search: true, facet: { limit: 2, order: "count" }, column: { header: "Region", drop: 2 } },
    { key: "size", label: "Length", value: (a) => a.size, type: "number", sort: true, column: { header: "Length", align: "end", drop: 2, note: "words" } },
    { key: "updated", label: "Updated", value: (a) => a.updated, type: "date", sort: true, column: { header: "Updated" } },
  ],
});
