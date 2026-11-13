export declare function scrollParent(el: Element | null | undefined): HTMLElement | null;
export declare function sectionsIn(scope: ParentNode): HTMLElement[];
export declare function sectionLabel(section: HTMLElement): string;
export declare function meetsRule(headings: Element[], scroller: HTMLElement | null, barHeight?: number): boolean;
export declare function currentSection(headings: HTMLElement[], scroller: HTMLElement | null, line?: number): HTMLElement | null;
export declare function watchSections(headings: HTMLElement[], onChange: (id: string | null) => void, scroller?: HTMLElement | null): () => void;
export declare function goToSection(heading: HTMLElement, opts?: {
    push?: boolean;
}): void;
export declare function measureBar(nav: HTMLElement, scroller: HTMLElement | null): void;
export declare function markSections(headings: HTMLElement[]): void;
export declare function enhance(root?: ParentNode): () => void;
