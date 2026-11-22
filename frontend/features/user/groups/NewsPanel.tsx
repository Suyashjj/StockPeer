"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import AiTab from "./AiTab";

type Item = {
    title: string;
    description: string;
    url: string;
    image: string | null;
    publishedAt: string;
    source: string;
};

function ago(iso: string) {
    const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return `${mins} min ago`;
    const h = Math.round(mins / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.round(h / 24);
    return `${d} ${d === 1 ? "day" : "days"} ago`;
}

export default function NewsPanel({ symbol, onClose }: { symbol: string; onClose: () => void }) {
    const [tab, setTab] = useState<"news" | "ai">("news");
    const [items, setItems] = useState<Item[] | null>(null);
    const [stale, setStale] = useState(false);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState(false);

    const load = useCallback(async () => {
        setItems(null);
        setError("");
        const res = await api(`/stocks/${encodeURIComponent(symbol)}/news`);
        if (res.ok) {
            setItems(res.data.items);
            setStale(!!res.data.stale);
        } else {
            setError(res.data?.message ?? "Could not load the news");
        }
    }, [symbol]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <aside
            className={`fixed inset-0 z-40 flex flex-col bg-surface lg:static lg:inset-auto lg:z-auto lg:shrink-0 lg:border-l lg:border-line ${expanded ? "lg:w-[44rem]" : "lg:w-96"
                }`}
        >
            <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-full p-2 text-ink-soft transition hover:bg-line/60 hover:text-ink"
                >
                    <ArrowLeft size={20} />
                </button>
                <p className="flex-1 font-heading font-bold text-ink">News · {symbol}</p>
                <button
                    onClick={() => setExpanded((v) => !v)}
                    aria-label={expanded ? "Make smaller" : "Expand"}
                    className="hidden rounded-full p-2 text-ink-soft transition hover:bg-line/60 hover:text-ink lg:block"
                >
                    {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>

            <div className="flex shrink-0 border-b border-line">
                {(
                    [
                        ["news", "Headlines"],
                        ["ai", "Ask AI"],
                    ] as const
                ).map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex-1 border-b-2 py-2.5 text-sm font-medium transition ${tab === id ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === "ai" ? (
                <AiTab symbol={symbol} />
            ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {stale && (
                        <p className="border-b border-line bg-line/40 px-4 py-2 text-xs text-ink-soft">
                            Showing saved news. It may be outdated.
                        </p>
                    )}

                    {!items && !error && <p className="p-4 text-sm text-ink-soft">Loading news...</p>}

                    {error && (
                        <div className="p-6 text-center">
                            <p className="text-sm text-down">{error}</p>
                            <button
                                onClick={load}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand"
                            >
                                <RefreshCw size={14} /> Try again
                            </button>
                        </div>
                    )}

                    {items && items.length === 0 && (
                        <p className="p-8 text-center text-sm text-ink-soft">
                            No recent news found for this company.
                        </p>
                    )}

                    {items && items.length > 0 && (
                        <ul className="divide-y divide-line">
                            {items.map((n) => (
                                <li key={n.url}>
                                    <a
                                        href={n.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex gap-3 px-4 py-4 transition hover:bg-line/30"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-ink-soft">
                                                {n.source} · {ago(n.publishedAt)}
                                            </p>
                                            <p className="mt-1 font-semibold text-ink">{n.title}</p>
                                            {n.description && (
                                                <p
                                                    className={`mt-1 text-sm text-ink-soft ${expanded ? "line-clamp-4" : "line-clamp-2"
                                                        }`}
                                                >
                                                    {n.description}
                                                </p>
                                            )}
                                            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand">
                                                Read article <ExternalLink size={12} />
                                            </p>
                                        </div>
                                        {n.image && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={n.image}
                                                alt=""
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => (e.currentTarget.style.display = "none")}
                                                className={`shrink-0 rounded-lg bg-line object-cover ${expanded ? "h-24 w-36" : "h-16 w-16"
                                                    }`}
                                            />
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <p className="shrink-0 border-t border-line px-4 py-2.5 text-[11px] text-ink-soft">
                {tab === "ai"
                    ? "AI summaries can be wrong. They only use the news shown here and are not investment advice."
                    : "News is third-party content, not investment advice. Free-plan news can be delayed."}
            </p>
        </aside>
    );
}