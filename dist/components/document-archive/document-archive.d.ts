export declare function groupByCategory<T>(docs: readonly T[], categoryOf: (item: T) => string, order?: readonly string[]): {
    category: string;
    docs: T[];
}[];
