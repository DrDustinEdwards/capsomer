export interface PollOption {
    id: string;
    label: string;
    votes: number;
}
export interface PollProps {
    options: PollOption[];
    mine?: string[];
    onVote?: (id: string) => void;
    closed?: boolean;
    pending?: boolean;
    label?: string;
}
export declare function Poll({ options, mine, onVote, closed, pending, label }: PollProps): import("react").JSX.Element;
