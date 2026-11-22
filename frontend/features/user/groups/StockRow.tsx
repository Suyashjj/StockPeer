"use client";

import Link from "next/link";
import { useState } from "react";
import { Users } from "lucide-react";
import { setJoined } from "./joinApi";
import PanGateDialog from "./PanGateDialog";
import type { StockItem } from "./types";

export default function StockRow({
    stock,
    onChange,
}: {
    stock: StockItem;
    onChange: (s: StockItem) => void;
}) {
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    const [gate, setGate] = useState<string | null>(null);

    async function toggle() {
        const next = !stock.joined;
        setBusy(true);
        setFailed(false);

        // Only joining can be blocked, so only leaving updates the row early
        if (!next) {
            onChange({ ...stock, joined: false, memberCount: Math.max(0, stock.memberCount - 1) });
        }

        const result = await setJoined(stock.symbol, next);
        if (result.ok) onChange(result.stock);
        else {
            onChange(stock);
            if (result.panRequired) setGate(result.panStatus);
            else setFailed(true);
        }
        setBusy(false);
    }

    return (
        <div className="flex items-center gap-4 px-5 py-4">
            <Link
                href={`/user/chats/${encodeURIComponent(stock.symbol)}`}
                className="min-w-0 flex-1"
            >
                <p className="truncate font-semibold text-ink">{stock.symbol}</p>
                <p className="truncate text-sm text-ink-soft">{stock.name}</p>
            </Link>

            <span className="hidden items-center gap-1.5 text-sm text-ink-soft sm:flex">
                <Users size={14} />
                {stock.memberCount}
            </span>

            {failed && <span className="text-xs text-down">Try again</span>}

            <button
                onClick={toggle}
                disabled={busy}
                title={stock.joined ? "Click to leave" : "Join this group"}
                className={`w-24 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${stock.joined
                    ? "border border-line bg-white text-ink hover:border-down/40 hover:text-down"
                    : "bg-brand text-white hover:opacity-90"
                    }`}
            >
                {stock.joined ? "Joined" : "Join"}
            </button>

            {gate && <PanGateDialog panStatus={gate} onClose={() => setGate(null)} />}
        </div>
    );
}