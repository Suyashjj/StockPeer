"use client";

import { useCallback, useEffect, useState } from "react";
import { Video } from "lucide-react";
import { api } from "@/lib/api";
import PageTitle from "@/features/user/components/PageTitle";
import { STATUS_BADGE, STATUS_LABEL, when } from "@/features/sessions/shared";

type Item = {
    id: string;
    topic: string;
    status: "SCHEDULED" | "COMPLETED";
    scheduledAt: string | null;
    meetingLink: string | null;
    durationMins: number;
    user: string;
};

export default function ExpertSessionsPage() {
    const [items, setItems] = useState<Item[] | null>(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        const res = await api("/expert/sessions");
        if (res.ok) setItems(res.data.items);
        else setError(res.data?.message ?? "Could not load your sessions");
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function complete(id: string) {
        const res = await api(`/expert/sessions/${id}/complete`, { method: "POST" });
        if (res.ok) load();
        else setError(res.data?.message ?? "Could not update");
    }

    return (
        <div className="space-y-6">
            <PageTitle title="Sessions" subtitle="Counselling sessions assigned to you." />
            {error && (
                <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{error}</p>
            )}
            {!items && !error && <p className="text-ink-soft">Loading...</p>}
            {items && items.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-ink-soft">
                    No sessions assigned yet.
                </p>
            )}
            {items && items.length > 0 && (
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
                                {s.user} · {when(s.scheduledAt)} · {s.durationMins} min
                            </p>
                            {s.status === "SCHEDULED" && (
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {s.meetingLink && (
                                        <a
                                            href={s.meetingLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                        >
                                            <Video size={15} /> Open Zoom
                                        </a>
                                    )}
                                    <button
                                        onClick={() => complete(s.id)}
                                        className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-up/40 hover:text-up"
                                    >
                                        Mark completed
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}