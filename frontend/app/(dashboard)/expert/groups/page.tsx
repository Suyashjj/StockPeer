"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Users } from "lucide-react";
import { api } from "@/lib/api";
import PageTitle from "@/features/user/components/PageTitle";

type G = { symbol: string; name: string; unlockedBy: number };

export default function ExpertGroupsPage() {
    const [items, setItems] = useState<G[] | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            const res = await api("/expert/groups");
            if (res.ok) setItems(res.data.items);
            else setError(res.data?.message ?? "Could not load your groups");
        })();
    }, []);

    return (
        <div className="space-y-6">
            <PageTitle title="My groups" subtitle="Premium groups you guide." />
            {error && (
                <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{error}</p>
            )}
            {!items && !error && <p className="text-ink-soft">Loading...</p>}
            {items && items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
                    <p className="text-ink-soft">No groups assigned yet.</p>
                    <Link
                        href="/expert/opportunities"
                        className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    >
                        Find opportunities
                    </Link>
                </div>
            )}
            {items && items.length > 0 && (
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                    {items.map((g) => (
                        <Link
                            key={g.symbol}
                            href={`/expert/groups/${encodeURIComponent(g.symbol)}`}
                            className="flex items-center gap-4 px-5 py-4 transition hover:bg-line/40"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-sm font-bold text-brand">
                                {g.symbol.slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-ink">{g.symbol}</p>
                                <p className="truncate text-sm text-ink-soft">{g.name}</p>
                            </div>
                            <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                                <Users size={14} /> {g.unlockedBy}
                            </span>
                            <ChevronRight size={16} className="text-ink-soft" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}