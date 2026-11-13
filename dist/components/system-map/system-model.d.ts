import { z } from "zod";
export declare const SYSTEM_FAMILIES: readonly ["system", "writing", "product", "plumbing", "site"];
export declare const SYSTEM_RINGS: readonly ["core", "shared", "used"];
export declare const RELATIONSHIP_KINDS: readonly ["installs", "publishes-to", "coordinates", "watches", "reads", "writes", "deploys", "serves"];
export declare const CONTAINER_KINDS: readonly ["worker", "database", "bucket", "kv", "queue", "cron", "package", "site", "external"];
export declare const PublicModelSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    as_of: z.ZodString;
    systems: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        family: z.ZodEnum<{
            site: "site";
            system: "system";
            writing: "writing";
            product: "product";
            plumbing: "plumbing";
        }>;
        short: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        ring: z.ZodEnum<{
            used: "used";
            shared: "shared";
            core: "core";
        }>;
        domain: z.ZodOptional<z.ZodString>;
        private: z.ZodLiteral<true>;
    }, z.core.$strict>, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        short: z.ZodString;
        family: z.ZodEnum<{
            site: "site";
            system: "system";
            writing: "writing";
            product: "product";
            plumbing: "plumbing";
        }>;
        ring: z.ZodEnum<{
            used: "used";
            shared: "shared";
            core: "core";
        }>;
        private: z.ZodLiteral<false>;
        description: z.ZodOptional<z.ZodString>;
        domain: z.ZodOptional<z.ZodString>;
        repos: z.ZodOptional<z.ZodArray<z.ZodURL>>;
    }, z.core.$strict>]>>;
    containers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        system: z.ZodString;
        name: z.ZodString;
        kind: z.ZodEnum<{
            site: "site";
            external: "external";
            database: "database";
            queue: "queue";
            worker: "worker";
            bucket: "bucket";
            kv: "kv";
            cron: "cron";
            package: "package";
        }>;
        technology: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    relationships: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        from: z.ZodString;
        to: z.ZodString;
        kind: z.ZodEnum<{
            installs: "installs";
            "publishes-to": "publishes-to";
            coordinates: "coordinates";
            watches: "watches";
            reads: "reads";
            writes: "writes";
            deploys: "deploys";
            serves: "serves";
        }>;
        title: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    flows: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        steps: z.ZodArray<z.ZodObject<{
            relationship: z.ZodString;
            toward: z.ZodString;
            text: z.ZodString;
            lights: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    counts: z.ZodObject<{
        systems: z.ZodNumber;
        public: z.ZodNumber;
        private: z.ZodNumber;
        containers: z.ZodNumber;
        relationships: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
export type PublicModel = z.infer<typeof PublicModelSchema>;
export type PublicSystem = PublicModel["systems"][number];
export type PublicContainer = PublicModel["containers"][number];
export type ModelResult = {
    ok: true;
    model: PublicModel;
} | {
    ok: false;
    problems: string[];
};
export declare function parsePublicModel(raw: unknown): ModelResult;
export declare function sameModel(a: PublicModel, b: PublicModel): boolean;
export declare const EXPLORER_ORIGIN = "https://capsid.dustinedwards.info";
export declare function explorerHref(id?: string, options?: {
    origin?: string;
    sub?: "containers" | "code";
}): string;
export declare function explorerLabel(id: string, origin?: string): string;
export declare const VERB_INWARD: Readonly<Record<string, string>>;
export interface Connection {
    verb: string;
    other: string;
    name: string;
}
export declare function connectionsOf(model: PublicModel, id: string): Connection[];
export declare const partsOf: (model: PublicModel, id: string) => PublicContainer[];
export declare const outsideOf: (model: PublicModel, id: string) => PublicContainer[];
export declare function wiresOf(model: PublicModel, id: string): string[];
export interface ModelMarkdownOptions {
    origin: string;
    pageHref: (id: string) => string;
    title?: string;
    intro?: string;
    rings?: Partial<Record<(typeof SYSTEM_RINGS)[number], string>>;
    privateNote?: string;
    explorerOrigin?: string;
}
export declare function systemMarkdown(model: PublicModel, id: string, o: ModelMarkdownOptions, level?: number): string | null;
export declare function modelMarkdown(model: PublicModel, o: ModelMarkdownOptions): string;
