export declare function pushSupported(): boolean;
export declare function deviceLabel(ua: string): string;
export declare class PushRefused extends Error {
}
export declare function subscribePush(opts: {
    worker: string;
    scope: string;
    publicKey: string;
}): Promise<{
    subscription: PushSubscriptionJSON;
    label: string;
}>;
