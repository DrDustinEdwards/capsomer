import { type PermMatrix, type PermView } from "./permission-matrix.ts";
export interface PermissionMatrixProps {
    matrix: PermMatrix;
    label?: string;
    defaultView?: PermView;
    view?: PermView;
    onViewChange?: (view: PermView) => void;
    note?: string;
}
export declare function PermissionMatrix(props: PermissionMatrixProps): import("react").JSX.Element;
