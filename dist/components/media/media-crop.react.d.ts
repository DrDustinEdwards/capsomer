export interface MediaCropProps {
    name: string;
    src: string;
    asNew: boolean;
    inPlace: boolean;
    keepsSize?: boolean;
    onSave: (file: File, how: "new" | "replace") => Promise<void>;
    open: boolean;
    opener: HTMLElement | null;
    onClose: () => void;
}
export default function MediaCrop({ name, src, asNew, inPlace, keepsSize, onSave, open, opener, onClose }: MediaCropProps): import("react").JSX.Element;
