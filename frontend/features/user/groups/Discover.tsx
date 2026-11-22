"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import StockRow from "./StockRow";
import { useStockSearch } from "./useStockSearch";

export default function Discover() {
    const [q, setQ] = useState("");
    const { items, total, loading, loadingMore, error, loadMore, updateItem } = useStockSearch(
        q.trim()
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft"
                />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by company or symbol, e.g. Reliance"
                    className="w-full rounded-lg border border-line bg-white py-2.5 pr-4 pl-10 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
            </div>

            {error && (
                <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{error}</p>
            )}

            {loading && <p className="text-ink-soft">Searching...</p>}

            {!loading && !error && items.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-ink-soft">
                    No stocks found.
                </p>
            )}

            {!loading && items.length > 0 && (
                <>
                    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                        {items.map((s) => (
                            <StockRow key={s.id} stock={s} onChange={updateItem} />
                        ))}
                    </div>

                    {items.length < total && (
                        <div className="text-center">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand disabled:opacity-60"
                            >
                                {loadingMore ? "Loading..." : `Load more (${total - items.length} left)`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}