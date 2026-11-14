export interface AdminErrorViewProps {
    error: unknown;
    home: string;
    homeLabel?: string;
    dev?: boolean;
}
export declare function AdminErrorView({ error, home, homeLabel, dev }: AdminErrorViewProps): import("react").JSX.Element;
