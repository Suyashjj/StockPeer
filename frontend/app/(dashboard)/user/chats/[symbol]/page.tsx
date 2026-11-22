"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Crown, Lock, MessageSquare, Users } from "lucide-react";
import { api } from "@/lib/api";
import { setJoined } from "@/features/user/groups/joinApi";
import type { StockItem } from "@/features/user/groups/types";
import ChatPanel from "@/features/user/groups/ChatPanel";
import PremiumArea from "@/features/user/groups/PremiumArea";
import PanGateDialog from "@/features/user/groups/PanGateDialog";

export default function ChatPage() {
    const params = useParams<{ symbol: string }>();
    const router = useRouter();
    const symbol = decodeURIComponent(params.symbol);

    const [stock, setStock] = useState<StockItem | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [gate, setGate] = useState<string | null>(null);
    const [channel, setChannel] = useState<"community" | "premium">("community");

    useEffect(() => {
        let cancelled = false;
        setStock(null);
        setError("");
        setChannel("community");
        (async () => {
            const res = await api(`/stocks/${encodeURIComponent(symbol)}`);
            if (cancelled) return;
            if (res.ok) setStock(res.data.stock);
            else setError(res.status === 404 ? "Stock not found" : "Could not load this stock");
        })();
        return () => {
            cancelled = true;
        };
    }, [symbol]);

    async function join() {
        if (!stock) return;
        setBusy(true);
        const result = await setJoined(stock.symbol, true);
        if (result.ok) {
            setStock(result.stock);
            window.dispatchEvent(new Event("chats:changed"));
        } else if (result.panRequired) {
            setGate(result.panStatus);
        }
        setBusy(false);
    }

    async function leave() {
        if (!stock) return;
        const result = await setJoined(stock.symbol, false);
        if (result.ok) {
            window.dispatchEvent(new Event("chats:changed"));
            router.push("/user/chats");
        }
    }

    if (error) {
        return (
            <div className="p-6">
                <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{error}</p>
            </div>
        );
    }
    if (!stock) return <p className="p-6 text-ink-soft">Loading...</p>;

    const tab = (id: "community" | "premium", label: string, icon: React.ReactNode) => (
        <button
            onClick={() => setChannel(id)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition ${channel === id
                    ? "border-brand text-brand"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
        >
            {icon} {label}
        </button>
    );

    return (
        <>
            {stock.joined ? (
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex shrink-0 gap-1 border-b border-line bg-surface px-3">
                        {tab("community", "Community", <MessageSquare size={15} />)}
                        {tab("premium", "Premium", <Crown size={15} />)}
                    </div>
                    {channel === "community" ? (
                        <ChatPanel key="community" stock={stock} onLeave={leave} />
                    ) : (
                        <PremiumArea key="premium" stock={stock} />
                    )}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-6">
                    <Link
                        href="/user/chats"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-ink lg:hidden"
                    >
                        <ArrowLeft size={14} /> Chats
                    </Link>
                    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 font-heading text-lg font-bold text-brand">
                            {stock.symbol.slice(0, 2)}
                        </div>
                        <h1 className="mt-4 font-heading text-2xl font-extrabold text-ink">{stock.symbol}</h1>
                        <p className="mt-1 text-ink-soft">{stock.name}</p>
                        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-ink-soft">
                            <Users size={14} />
                            {stock.memberCount === 0 ? "Be the first to join" : `${stock.memberCount} members`}
                        </p>
                        <button
                            onClick={join}
                            disabled={busy}
                            className="mt-6 w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                            {busy ? "Please wait..." : "Join group"}
                        </button>
                        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
                            <Lock size={12} /> Join to see the discussion
                        </p>
                    </div>
                </div>
            )}
            {gate && <PanGateDialog panStatus={gate} onClose={() => setGate(null)} />}
        </>
    );
}