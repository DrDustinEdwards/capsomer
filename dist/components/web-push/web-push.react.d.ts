import { type ReactNode } from "react";
export interface PushDevice {
    id: string | number;
    label: ReactNode;
    detail?: ReactNode;
}
export type PushNote = {
    kind: "ok" | "crit";
    text: ReactNode;
};
export interface PushDevicesProps {
    publicKey: string | null;
    worker: string;
    scope: string;
    devices: PushDevice[];
    busy?: boolean;
    note?: PushNote | null;
    problem?: ReactNode;
    onTurnOn: (subscription: PushSubscriptionJSON, label: string) => Promise<void> | void;
    onTurnOff: (id: PushDevice["id"]) => void;
    onTest: () => void;
}
export declare function PushDevices({ publicKey, worker, scope, devices, busy, note, problem, onTurnOn, onTurnOff, onTest, }: PushDevicesProps): import("react").JSX.Element;
