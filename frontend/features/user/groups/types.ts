export type LastMessage = {
    body: string;
    createdAt: string;
    senderName: string;
    mine: boolean;
};

export type StockItem = {
    id: string;
    symbol: string;
    name: string;
    sector: string | null;
    memberCount: number;
    joined: boolean;
    unread?: number;
    lastMessage?: LastMessage | null;
    hasPremium?: boolean;
};