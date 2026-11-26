export interface Row<V> {
    id: string;
    value: V;
    index: number;
}
export declare function useRows<V>(value: readonly V[], onChange: (next: V[]) => void): {
    items: Row<V>[];
    getId: (r: Row<V>) => string;
    onReorder: (order: string[]) => void;
    onRemove: (id: string) => void;
};
