"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import FileCard from "./FileCard";
import type { ChatFile } from "./useChat";

type Item = { id: string; createdAt: string; sender: { name: string }; file: ChatFile };
type Tab = "media" | "docs";

const TABS: { id: Tab; label: string }[] = [
    { id: "media", label: "Media" },
    { id: "docs", label: "Files" },
];

function day(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function MediaPanel({
    symbol,
    channel,
    onClose,
    onOpenImage,
}: {
    symbol: string;
    channel: "community" | "premium";
    onClose: () => void;
    onOpenImage: (f: ChatFile) => void;
}) {
    const [tab, setTab] = useState<Tab>("media");
    const [items, setItems] = useState<Item[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setItems([]);
        setError("");
        (async () => {
            const res = await api(
                `/stocks/${encodeURIComponent(symbol)}/files?type=${tab}&channel=${channel}`
            );
            if (cancelled) return;
            if (res.ok) {
                setItems(res.data.items);
                setHasMore(res.data.hasMore);
            } else {
                setError(res.data?.message ?? "Could not load files");
            }
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [symbol, tab, channel]);

    async function more() {
        const before = items[items.length - 1]?.createdAt;
        if (!before) return;
        setLoadingMore(true);
        const res = await api(
            `/stocks/${encodeURIComponent(symbol)}/files?type=${tab}&channel=${channel}&before=${encodeURIComponent(before)}`
        );
        if (res.ok) {
            setItems((cur) => [...cur, ...res.data.items]);
            setHasMore(res.data.hasMore);
        }
        setLoadingMore(false);
    }

    return (
        <aside className="fixed inset-0 z-40 flex flex-col bg-surface lg:static lg:inset-auto lg:z-auto lg:w-80 lg:shrink-0 lg:border-l lg:border-line">
            <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-full p-2 text-ink-soft transition hover:bg-line/60 hover:text-ink"
                >
                    <ArrowLeft size={20} />
                </button>
                <p className="font-heading font-bold text-ink">Media & files</p>
            </div>

            <div className="flex shrink-0 border-b border-line">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 border-b-2 py-2.5 text-sm font-medium transition ${tab === t.id
                            ? "border-brand text-brand"
                            : "border-transparent text-ink-soft hover:text-ink"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {loading && <p className="p-2 text-sm text-ink-soft">Loading...</p>}
                {error && <p className="p-2 text-sm text-down">{error}</p>}
                {!loading && !error && items.length === 0 && (
                    <p className="p-6 text-center text-sm text-ink-soft">
                        {tab === "media" ? "No photos shared yet." : "No files shared yet."}
                    </p>
                )}

                {tab === "media" ? (
                    <div className="grid grid-cols-3 gap-1.5">
                        {items.map((i) => (
                            <button
                                key={i.id}
                                onClick={() => onOpenImage(i.file)}
                                className="aspect-square overflow-hidden rounded-md bg-line"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={i.file.url}
                                    alt={i.file.name}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((i) => (
                            <div key={i.id}>
                                <FileCard file={i.file} />
                                <p className="mt-1 px-1 text-[11px] text-ink-soft">
                                    {i.sender.name} · {day(i.createdAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {hasMore && (
                    <div className="pt-3 text-center">
                        <button
                            onClick={more}
                            disabled={loadingMore}
                            className="rounded-lg border border-line bg-white px-4 py-2 text-xs font-medium text-ink transition hover:border-brand disabled:opacity-60"
                        >
                            {loadingMore ? "Loading..." : "Load more"}
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}