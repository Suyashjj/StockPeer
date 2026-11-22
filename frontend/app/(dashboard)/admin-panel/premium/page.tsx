"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAdminGet } from "@/features/admin/useAdminGet";
import { Card, EmptyState, ErrorBox, PageHeader } from "@/features/admin/components/ReviewParts";
import LimitControl from "@/features/admin/components/LimitControl";

type Expert = { id: string; name: string; email: string; expertType?: string };
type Group = {
    id: string;
    symbol: string;
    name: string;
    maxExperts: number;
    unlockedBy: number;
    experts: { id: string; name: string }[];
};
type StockHit = { symbol: string; name: string; hasPremium: boolean };

const TYPE_LABEL: Record<string, string> = {
    SEBI_RA: "SEBI Research Analyst",
    SEBI_IA: "SEBI Investment Adviser",
};

export default function PremiumGroupsPage() {
    const [version, setVersion] = useState(0);
    const groups = useAdminGet<{ items: Group[] }>(`/admin/premium/groups?v=${version}`);
    const experts = useAdminGet<{ items: Expert[] }>("/admin/premium/experts");

    const [expertId, setExpertId] = useState("");
    const [q, setQ] = useState("");
    const [hits, setHits] = useState<StockHit[]>([]);
    const [busy, setBusy] = useState("");
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    // Stock search, waits 300 ms after typing
    useEffect(() => {
        const term = q.trim();
        if (term.length < 2) {
            setHits([]);
            return;
        }
        const t = setTimeout(async () => {
            const res = await api(`/admin/premium/stocks?q=${encodeURIComponent(term)}`);
            if (res.ok) setHits(res.data.items);
        }, 300);
        return () => clearTimeout(t);
    }, [q, version]);

    async function assign(symbol: string) {
        if (!expertId) {
            setMessage({ ok: false, text: "Choose an expert first." });
            return;
        }
        setBusy(symbol);
        setMessage(null);
        const res = await api("/admin/premium/assign", {
            method: "POST",
            body: { symbol, expertId },
        });
        if (res.ok) {
            setMessage({ ok: true, text: `Assigned to ${symbol}.` });
            setVersion((v) => v + 1);
        } else {
            setMessage({ ok: false, text: res.data?.message ?? "Could not assign" });
        }
        setBusy("");
    }

    async function remove(groupId: string, expertId: string) {
        setBusy(groupId + expertId);
        setMessage(null);
        const res = await api(`/admin/premium/groups/${groupId}/experts/${expertId}`, {
            method: "DELETE",
        });
        if (res.ok) setVersion((v) => v + 1);
        else setMessage({ ok: false, text: res.data?.message ?? "Could not remove" });
        setBusy("");
    }

    const eligible = experts.data?.items ?? [];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Premium groups"
                subtitle="Assign an expert to a stock. This creates its premium group."
            />

            {message && (
                <p className={`text-sm ${message.ok ? "text-up" : "text-down"}`}>{message.text}</p>
            )}

            <Card title="Assign an expert">
                {experts.error && <ErrorBox text={experts.error} />}
                {experts.data && eligible.length === 0 && (
                    <p className="text-sm text-ink-soft">
                        No eligible experts yet. Approve a SEBI Research Analyst or Investment
                        Adviser application first.
                    </p>
                )}

                {eligible.length > 0 && (
                    <div className="space-y-4">
                        <select
                            value={expertId}
                            onChange={(e) => setExpertId(e.target.value)}
                            className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        >
                            <option value="">Choose an expert</option>
                            {eligible.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.name} ({TYPE_LABEL[e.expertType ?? ""] ?? e.expertType})
                                </option>
                            ))}
                        </select>

                        <div className="relative">
                            <Search
                                size={15}
                                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft"
                            />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search a stock, e.g. Reliance"
                                className="w-full rounded-lg border border-line bg-white py-2.5 pr-4 pl-10 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20"
                            />
                        </div>

                        {hits.length > 0 && (
                            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                                {hits.map((h) => (
                                    <div key={h.symbol} className="flex items-center gap-3 px-4 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-ink">{h.symbol}</p>
                                            <p className="truncate text-sm text-ink-soft">{h.name}</p>
                                        </div>
                                        {h.hasPremium && (
                                            <span className="rounded-full bg-up/10 px-2.5 py-1 text-xs font-medium text-up">
                                                Has premium group
                                            </span>
                                        )}
                                        <button
                                            onClick={() => assign(h.symbol)}
                                            disabled={busy === h.symbol}
                                            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                                        >
                                            {busy === h.symbol ? "Assigning..." : "Assign"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <div>
                <h2 className="mb-3 text-lg font-semibold text-ink">Existing premium groups</h2>
                {groups.loading && <p className="text-ink-soft">Loading...</p>}
                {groups.error && <ErrorBox text={groups.error} />}
                {groups.data && groups.data.items.length === 0 && (
                    <EmptyState text="No premium groups yet." />
                )}
                {groups.data && groups.data.items.length > 0 && (
                    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                        {groups.data.items.map((g) => (
                            <div key={g.id} className="px-5 py-4">
                                <div className="flex items-baseline justify-between gap-3">
                                    <p className="font-semibold text-ink">
                                        {g.symbol}{" "}
                                        <span className="font-normal text-ink-soft">· {g.name}</span>
                                    </p>
                                    <span className="shrink-0 text-xs text-ink-soft">
                                        {g.unlockedBy} unlocked
                                    </span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {g.experts.map((e) => (
                                        <span
                                            key={e.id}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 py-1 pr-1.5 pl-3 text-xs font-medium text-brand"
                                        >
                                            {e.name}
                                            <button
                                                onClick={() => remove(g.id, e.id)}
                                                disabled={busy === g.id + e.id}
                                                aria-label={`Remove ${e.name}`}
                                                className="rounded-full p-0.5 transition hover:bg-brand/20 disabled:opacity-50"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    {g.experts.length === 0 && (
                                        <span className="text-xs text-down">No expert assigned</span>
                                    )}
                                </div>
                                <LimitControl
                                    groupId={g.id}
                                    experts={g.experts.length}
                                    max={g.maxExperts}
                                    onChanged={() => setVersion((v) => v + 1)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}