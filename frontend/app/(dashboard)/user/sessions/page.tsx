"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Video } from "lucide-react";
import { api } from "@/lib/api";
import PageTitle from "@/features/user/components/PageTitle";
import { STATUS_BADGE, STATUS_LABEL, when } from "@/features/sessions/shared";

type Item = {
    id: string;
    topic: string;
    status: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
    preferredAt: string | null;
    scheduledAt: string | null;
    meetingLink: string | null;
    durationMins: number;
    expert: string | null;
};
type Credits = { total: number; used: number; left: number } | null;

const field =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function SessionsPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [credits, setCredits] = useState<Credits>(null);
    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState("");
    const [preferred, setPreferred] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const load = useCallback(async () => {
        const res = await api("/sessions");
        if (res.ok) {
            setItems(res.data.items);
            setCredits(res.data.credits);
        } else {
            setMsg({ ok: false, text: res.data?.message ?? "Could not load your sessions" });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function request(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const res = await api("/sessions", {
            method: "POST",
            body: {
                topic,
                ...(preferred ? { preferredAt: new Date(preferred).toISOString() } : {}),
            },
        });
        if (res.ok) {
            setTopic("");
            setPreferred("");
            setMsg({ ok: true, text: "Request sent. We'll confirm the time and send the Zoom link here." });
            await load();
        } else {
            setMsg({ ok: false, text: res.data?.message ?? "Could not send the request" });
        }
        setBusy(false);
    }

    async function cancel(id: string) {
        if (!confirm("Cancel this session?")) return;
        const res = await api(`/sessions/${id}/cancel`, { method: "POST" });
        if (res.ok) {
            setMsg({
                ok: true,
                text: res.data.refunded
                    ? "Session cancelled. Your credit was returned."
                    : "Session cancelled. It was within 24 hours, so the credit was not returned.",
            });
            await load();
        } else {
            setMsg({ ok: false, text: res.data?.message ?? "Could not cancel" });
        }
    }

    return (
        <div className="space-y-8">
            <PageTitle
                title="Sessions"
                subtitle="One-to-one counselling with an expert, over Zoom."
            />

            {msg && (
                <p
                    className={`rounded-xl border p-4 text-sm ${msg.ok ? "border-up/30 bg-up/5 text-up" : "border-down/30 bg-down/5 text-down"
                        }`}
                >
                    {msg.text}
                </p>
            )}

            {loading && <p className="text-ink-soft">Loading...</p>}

            {!loading && !credits && (
                <div className="rounded-2xl border border-line bg-surface p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <CalendarClock size={22} />
                    </div>
                    <p className="mt-4 font-semibold text-ink">Counselling is part of the Elite plan</p>
                    <p className="mt-1 text-sm text-ink-soft">
                        Elite members get personal sessions with an expert.
                    </p>
                    <Link
                        href="/user/premium"
                        className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    >
                        See plans
                    </Link>
                </div>
            )}

            {credits && (
                <form onSubmit={request} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-ink">Request a session</h2>
                        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                            {credits.left} of {credits.total} left
                        </span>
                    </div>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        rows={3}
                        maxLength={300}
                        placeholder="What would you like to discuss? (for example, a stock or a portfolio question)"
                        className={field}
                    />
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink">
                            Preferred time (optional)
                        </label>
                        <input
                            type="datetime-local"
                            value={preferred}
                            onChange={(e) => setPreferred(e.target.value)}
                            className={field}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={busy || credits.left === 0 || topic.trim().length < 5}
                        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                        {busy ? "Sending..." : credits.left === 0 ? "No sessions left" : "Request session"}
                    </button>
                    <p className="text-xs text-ink-soft">
                        Sessions are 20 minutes. Free cancellation until 24 hours before the session.
                    </p>
                </form>
            )}

            {items.length > 0 && (
                <div>
                    <h2 className="mb-3 text-lg font-semibold text-ink">Your sessions</h2>
                    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                        {items.map((s) => (
                            <div key={s.id} className="px-5 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="font-medium text-ink">{s.topic}</p>
                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[s.status]}`}
                                    >
                                        {STATUS_LABEL[s.status]}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-ink-soft">
                                    {s.status === "SCHEDULED" || s.status === "COMPLETED"
                                        ? `${when(s.scheduledAt)} · ${s.durationMins} min${s.expert ? ` · with ${s.expert}` : ""
                                        }`
                                        : s.preferredAt
                                            ? `Preferred: ${when(s.preferredAt)}`
                                            : "Waiting for a time to be set"}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {s.status === "SCHEDULED" && s.meetingLink && (
                                        <a
                                            href={s.meetingLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                        >
                                            <Video size={15} /> Join on Zoom
                                        </a>
                                    )}
                                    {(s.status === "REQUESTED" || s.status === "SCHEDULED") && (
                                        <button
                                            onClick={() => cancel(s.id)}
                                            className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-down/40 hover:text-down"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}