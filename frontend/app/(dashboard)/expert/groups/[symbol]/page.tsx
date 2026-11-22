"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ChatPanel from "@/features/user/groups/ChatPanel";
import type { StockItem } from "@/features/user/groups/types";

export default function ExpertChatPage() {
    const params = useParams<{ symbol: string }>();
    const symbol = decodeURIComponent(params.symbol);
    const [stock, setStock] = useState<StockItem | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            const res = await api("/expert/groups");
            if (!res.ok) return setError(res.data?.message ?? "Could not load this group");
            const g = (res.data.items as { symbol: string; name: string; unlockedBy: number }[]).find(
                (x) => x.symbol === symbol
            );
            if (!g) return setError("You are not assigned to this group");
            setStock({
                id: g.symbol,
                symbol: g.symbol,
                name: g.name,
                sector: null,
                memberCount: g.unlockedBy,
                joined: true,
            });
        })();
    }, [symbol]);

    if (error) {
        return <p className="m-6 rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{error}</p>;
    }
    if (!stock) return <p className="p-6 text-ink-soft">Loading...</p>;

    return (
        <div className="flex h-[100dvh] flex-col lg:h-screen">
            <ChatPanel
                stock={stock}
                channel="premium"
                backHref="/expert/groups"
                onLeave={async () => { }}
            />
        </div>
    );
}