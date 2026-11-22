"use client";

import { useState } from "react";
import { MessageSquare, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { EXPERT_TYPES } from "@/features/auth/schemas";
import { useAdminGet } from "@/features/admin/useAdminGet";
import { EmptyState, ErrorBox, formatDate, PageHeader } from "@/features/admin/components/ReviewParts";

type Item = {
    id: string;
    note: string | null;
    createdAt: string;
    expert: {
        name: string;
        email: string;
        expertType?: string;
        experienceYears?: number;
        expertise?: string[];
        bio?: string;
    };
    stock: { symbol: string; name: string };
    experts: number;
    maxExperts: number;
    members: number;
    messages7d: number;
    requests: number;
};

const typeLabel = (v?: string) => EXPERT_TYPES.find((t) => t.value === v)?.label ?? v ?? "";

function RequestCard({ item, onDone }: { item: Item; onDone: () => void }) {
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function decide(approve: boolean) {
        if (!approve && !reason.trim()) {
            setError("Write a reason so the expert knows why.");
            return;
        }
        setBusy(true);
        setError("");
        const res = await api(`/admin/premium/requests/${item.id}/decision`, {
            method: "POST",
            body: approve ? { approve: true } : { approve: false, reason: reason.trim() },
        });
        if (res.ok) onDone();
        else {
            setError(res.data?.message ?? "Something went wrong");
            setBusy(false);
        }
    }

    const full = item.experts >= item.maxExperts;

    return (
        <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-ink">
                    {item.stock.symbol} <span className="font-normal text-ink-soft">· {item.stock.name}</span>
                </p>
                <span className="text-xs text-ink-soft">{formatDate(item.createdAt)}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
                <span className="flex items-center gap-1"><Users size={13} /> {item.members} members</span>
                <span className="flex items-center gap-1"><MessageSquare size={13} /> {item.messages7d} msgs / 7d</span>
                <span className="flex items-center gap-1"><UserPlus size={13} /> {item.requests} asked for expert</span>
                <span className={`rounded-full px-2 py-0.5 ${full ? "bg-down/10 text-down" : "bg-line"}`}>
                    Experts {item.experts}/{item.maxExperts}
                </span>
            </div>

            <div className="mt-4 rounded-xl bg-paper p-4">
                <p className="font-medium text-ink">
                    {item.expert.name}{" "}
                    <span className="text-sm font-normal text-ink-soft">
                        · {typeLabel(item.expert.expertType)} · {item.expert.experienceYears ?? 0} yrs
                    </span>
                </p>
                <p className="text-xs text-ink-soft">{item.expert.email}</p>
                {item.expert.expertise && item.expert.expertise.length > 0 && (
                    <p className="mt-2 text-sm text-ink">{item.expert.expertise.join(", ")}</p>
                )}
                {item.expert.bio && <p className="mt-2 text-sm text-ink-soft">{item.expert.bio}</p>}
                {item.note && (
                    <p className="mt-3 border-t border-line pt-3 text-sm text-ink">
                        <span className="text-ink-soft">Note: </span>
                        {item.note}
                    </p>
                )}
            </div>

            {full && (
                <p className="mt-3 text-xs text-down">
                    This group is full. Raise its limit in Premium groups before approving.
                </p>
            )}

            {rejecting ? (
                <div className="mt-4 space-y-3">
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        maxLength={300}
                        placeholder="Reason (shown to the expert)"
                        className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => decide(false)}
                            disabled={busy}
                            className="rounded-lg bg-down px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                            {busy ? "Rejecting..." : "Confirm rejection"}
                        </button>
                        <button
                            onClick={() => {
                                setRejecting(false);
                                setError("");
                            }}
                            className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-4 flex gap-3">
                    <button
                        onClick={() => decide(true)}
                        disabled={busy}
                        className="rounded-lg bg-up px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                        {busy ? "Approving..." : "Approve"}
                    </button>
                    <button
                        onClick={() => setRejecting(true)}
                        disabled={busy}
                        className="rounded-lg border border-down/40 bg-white px-5 py-2.5 text-sm font-medium text-down transition hover:bg-down/5"
                    >
                        Reject
                    </button>
                </div>
            )}
            {error && <p className="mt-3 text-sm text-down">{error}</p>}
        </div>
    );
}

export default function ExpertRequestsPage() {
    const [version, setVersion] = useState(0);
    const { data, loading, error } = useAdminGet<{ items: Item[] }>(
        `/admin/premium/requests?v=${version}`
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Expert requests"
                subtitle="Experts asking to guide a premium group. Oldest first."
            />
            {loading && <p className="text-ink-soft">Loading...</p>}
            {error && <ErrorBox text={error} />}
            {data && data.items.length === 0 && <EmptyState text="No pending requests." />}
            {data?.items.map((i) => (
                <RequestCard key={i.id} item={i} onDone={() => setVersion((v) => v + 1)} />
            ))}
        </div>
    );
}