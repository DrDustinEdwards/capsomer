// A collection for the catalog's specimen and its spec: a small protocol library, big enough to filter, search,
// sort and page. It is data, not copy: the names are made up for the specimen.
import { defineCatalog } from "./catalog-core.ts";

export interface Protocol {
  id: string;
  title: string;
  kind: "protocol" | "recipe" | "computational";
  methods: string[];
  organisms: string[];
  size: number | null;
  updated: string;
}

const METHODS = ["plating", "pcr", "extraction", "culture", "sequencing", "annotation", "media", "microscopy"];
const ORGANISMS = ["smegmatis", "foliorum", "avian", "human"];

export const PROTOCOLS: Protocol[] = Array.from({ length: 27 }, (_, i) => {
  const kind = i % 9 === 8 ? "computational" : i % 5 === 4 ? "recipe" : "protocol";
  return {
    id: `p${String(i + 1).padStart(2, "0")}`,
    title: `${["Phage", "Viral", "Plate", "Primer", "Lysate", "Genome", "Culture", "Buffer", "Titer"][i % 9]} ${["isolation", "extraction", "purification", "screen", "titer", "annotation", "prep"][i % 7]} ${i + 1}`,
    kind,
    methods: [METHODS[i % METHODS.length] as string, ...(i % 4 === 0 ? [METHODS[(i + 3) % METHODS.length] as string] : [])],
    organisms: i % 3 === 0 ? [] : [ORGANISMS[i % ORGANISMS.length] as string],
    size: kind === "protocol" && i % 2 === 0 ? 300 + i * 11 : null,
    updated: `2026-0${(i % 9) + 1}-${String((i * 3) % 27 + 1).padStart(2, "0")}`,
  };
});

export const protocolCatalog = defineCatalog<Protocol>({
  id: "protocols",
  noun: ["protocol", "protocols"],
  basePath: "/components/catalog/states.html",
  itemKey: (p) => p.id,
  defaultSort: "-updated",
  pageSize: 10,
  fields: [
    { key: "title", label: "Name", value: (p) => p.title, search: 3, sort: true, column: { header: "Name" } },
    { key: "kind", label: "Kind", value: (p) => p.kind, facet: { general: true, kind: "one", order: ["protocol", "recipe", "computational"] }, column: { header: "Kind" } },
    { key: "method", label: "Method", value: (p) => p.methods, search: 2, facet: { general: true, order: "alpha" }, column: { header: "Method", drop: 1 } },
    { key: "organism", label: "Organism", value: (p) => p.organisms, search: true, facet: { limit: 2, order: "count" }, column: { header: "Organism", drop: 2 } },
    { key: "size", label: "Product size", value: (p) => p.size, type: "number", sort: true, column: { header: "Product size", align: "end", drop: 2, note: "bp" } },
    { key: "updated", label: "Updated", value: (p) => p.updated, type: "date", sort: true, column: { header: "Updated" } },
  ],
});
