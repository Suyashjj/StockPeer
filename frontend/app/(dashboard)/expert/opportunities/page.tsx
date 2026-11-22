"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api";
import PageTitle from "@/features/user/components/PageTitle";

type Opp = {
    symbol: string;
    name: string;
    members: number;
    messages7d: number;
    requests: number;
    slotsLeft: number;
    applied: boolean;
};
type Req = {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectReason: string | null;
    createdAt: string;
    stock: { symbol: string; name: string };
};

const BADGE = {
    PENDING: "bg-brand/10 text-brand",
    APPROVED: "bg-up/10 text-up",
    REJECTED: "bg-down/10 text-down",
};

export default function OpportunitiesPage() {
    const [opps, setOpps] = useState<Opp[]>([]);
    const [reqs, setReqs] = useState<Req[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [open, setOpen] = useState("");
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const load = useCallback(async () => {
        const [o, r] = await Promise.all([api("/expert/opportunities"), api("/expert/requests")]);
        if (o.ok) setOpps(o.data.items);
        else setError(o.data?.message ?? "Could not load opportunities");
        if (r.ok) setReqs(r.data.items);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function apply(symbol: string) {
        setBusy(true);
        setMsg(null);
        const res = await api("/expert/requests", { method: "POST", body: { symbol, note } });
        if (res.ok) {
            setMsg({ ok: true, text: `Request sent for ${symbol}. Admin will review it.` });
            setOpen("");
            setNote("");
            await load();
        } else {
            setMsg({ ok: false, text: res.data?.message ?? "Could not send the request" });
        }
        setBusy(false);
    }

    return (
        <div className="space-y-8">
            <PageTitle
                title="Opportunities"
                subtitle="Active stock groups that need an expert. Apply and admin will review."
            />

            {msg && <p className={`text-sm ${msg.ok ? "text-up" : "text-down"}`}>{msg.text}</p>}
            {error && (
                <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{error}</p>
            )}
            {loading && <p className="text-ink-soft">Loading...</p>}

            {!loading && !error && opps.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-ink-soft">
                    No open groups right now.
                </p>
            )}

            {opps.length > 0 && (
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                    {opps.map((o) => (
                        <div key={o.symbol} className="px-5 py-4">
                            <div className="flex items-center gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-ink">{o.symbol}</p>
                                    <p className="truncate text-sm text-ink-soft">{o.name}</p>
                                </div>
                                <div className="hidden items-center gap-4 text-xs text-ink-soft sm:flex">
                                    <span className="flex items-center gap-1" title="Members">
                                        <Users size={13} /> {o.members}
                                    </span>
                                    <span className="flex items-center gap-1" title="Messages, last 7 days">
                                        <MessageSquare size={13} /> {o.messages7d}
                                    </span>
                                    <span className="flex items-center gap-1" title="Members asking for an expert">
                                        <UserPlus size={13} /> {o.requests}
                                    </span>
                                    <span className="rounded-full bg-line px-2 py-0.5">
                                        {o.slotsLeft} {o.slotsLeft === 1 ? "slot" : "slots"}
                                    </span>
                                </div>
                                {o.applied ? (
                                    <span className="rounded-lg border border-line px-4 py-2 text-sm text-ink-soft">
                                        Applied ✓
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setOpen(open === o.symbol ? "" : o.symbol);
                                            setNote("");
                                        }}
                                        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>

                            {open === o.symbol && (
                                <div className="mt-4 space-y-3">
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={3}
                                        maxLength={300}
                                        placeholder="Why are you a good fit for this stock? (optional)"
                                        className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20"
                                    />
                                    <button
                                        onClick={() => apply(o.symbol)}
                                        disabled={busy}
                                        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                                    >
                                        {busy ? "Sending..." : "Send request"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {reqs.length > 0 && (
                <div>
                    <h2 className="mb-3 text-lg font-semibold text-ink">My requests</h2>
                    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                        {reqs.map((r) => (
                            <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-ink">{r.stock.symbol}</p>
                                    {r.status === "REJECTED" && (
                                        <p className="text-xs text-down">
                                            {r.rejectReason ?? "Not approved"}
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs text-ink-soft">
                                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </span>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[r.status]}`}
                                >
                                    {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}