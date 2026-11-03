import { type GateChoice } from "./approval-sheet.ts";
export type { GateChoice } from "./approval-sheet.ts";
export interface Gate {
    id: string;
    title: string;
    command: string;
    meta?: string;
    include?: boolean;
}
export interface ApprovalSheetProps {
    open: boolean;
    gates: Gate[];
    onApprove: (gates: GateChoice[]) => void | Promise<void>;
    onClose: () => void;
    lead?: string;
}
export declare function ApprovalSheet({ open, gates, onApprove, onClose, lead }: ApprovalSheetProps): import("react").JSX.Element;
