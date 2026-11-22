"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StockRow from "./StockRow";
import type { StockItem } from "./types";

export default function MyGroups({ onFind }: { onFind: () => void }) {
    const [items, setItems] = useState<StockItem[] | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await api("/stocks/mine");
            if (cancelled) return;
            if (res.ok) setItems(res.data.items);
            else setError(res.data?.message ?? "Could not load your groups");
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Leaving removes the row, otherwise the row is updated in place
    function handleChange(s: StockItem) {
        setItems((cur) =>
            cur ? (s.joined ? cur.map((x) => (x.id === s.id ? s : x)) : cur.filter((x) => x.id !== s.id)) : cur
        );
    }

    if (error) {
        return <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{error}</p>;
    }
    if (!items) return <p className="text-ink-soft">Loading...</p>;

    if (items.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
                <p className="text-ink-soft">You haven't joined any group yet.</p>
                <button
                    onClick={onFind}
                    className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                    Find a stock
                </button>
            </div>
        );
    }

    return (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {items.map((s) => (
                <StockRow key={s.id} stock={s} onChange={handleChange} />
            ))}
        </div>
    );
}