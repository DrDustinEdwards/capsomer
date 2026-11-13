export interface CarouselParts {
    root: HTMLElement;
    track: HTMLElement;
    slides: HTMLElement[];
    markers: HTMLButtonElement[];
    prev: HTMLButtonElement | null;
    next: HTMLButtonElement | null;
    status: HTMLElement | null;
}
export declare function partsOf(root: HTMLElement): CarouselParts | null;
export declare function statusText(template: string | undefined, n: number, total: number): string;
export declare function canLoop(count: number): boolean;
export declare function attach(parts: CarouselParts): () => void;
export declare function enhance(root?: ParentNode): () => void;
