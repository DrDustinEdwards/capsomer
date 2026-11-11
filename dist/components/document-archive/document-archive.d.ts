export declare function adjacent<T>(list: readonly T[], key: string, keyOf: (item: T) => string): {
    prev: T | null;
    next: T | null;
};
export declare function groupByCategory<T>(docs: readonly T[], categoryOf: (item: T) => string, order?: readonly string[]): {
    category: string;
    docs: T[];
}[];
