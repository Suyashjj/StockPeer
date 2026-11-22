"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAdminGet } from "@/features/admin/useAdminGet";
import { EmptyState, ErrorBox, PageHeader } from "@/features/admin/components/ReviewParts";
import { STATUS_BADGE, STATUS_LABEL, toLocalInput, when } from "@/features/sessions/shared";

type Item = {
    id: string;
    topic: string;
    status: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
    preferredAt: string | null;
    scheduledAt: string | null;
    meetingLink: string | null;
    user: { name: string; email: string };
    expert: { id: string; name: string } | null;
};
type Expert = { id: string; name: string };

const field =
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function Card({ s, experts, onDone }: { s: Item; experts: Expert[]; onDone: () => void }) {
    const [expertId, setExpertId] = useState(s.expert?.id ?? "");
    const [at, setAt] = useState(toLocalInput(s.scheduledAt ?? s.preferredAt));
    const [link, setLink] = useState(s.meetingLink ?? "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function call(path: string, body?: unknown) {
        setBusy(true);
        setError("");
        const res = await api(`/admin/sessions/${s.id}/${path}`, { method: "POST", body });
        if (res.ok) onDone();
        else {
            setError(res.data?.message ?? "Something went wrong");
            setBusy(false);
        }
    }

    const history = s.status === "COMPLETED" || s.status === "CANCELLED";

    return (
        <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-semibold text-ink">{s.user.name}</p>
                    <p className="text-xs text-ink-soft">{s.user.email}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                </span>
            </div>
            <p className="mt-3 text-sm text-ink">{s.topic}</p>
            <p className="mt-1 text-xs text-ink-soft">
                {s.preferredAt ? `Preferred: ${when(s.preferredAt)}` : "No preferred time"}
                {s.scheduledAt && ` · Scheduled: ${when(s.scheduledAt)}`}
                {s.expert && ` · ${s.expert.name}`}
            </p>

            {!history && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <select value={expertId} onChange={(e) => setExpertId(e.target.value)} className={field}>
                        <option value="">Choose expert</option>
                        {experts.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="datetime-local"
                        value={at}
                        onChange={(e) => setAt(e.target.value)}
                        className={field}
                    />
                    <input
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="Zoom link (https://...)"
                        className={field}
                    />
                </div>
            )}

            {!history && (
                <div className="mt-4 flex flex-wrap gap-3">
                    <button
                        onClick={() =>
                            call("schedule", {
                                expertId,
                                scheduledAt: at ? new Date(at).toISOString() : "",
                                meetingLink: link,
                            })
                        }
                        disabled={busy}
                        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                        {s.status === "SCHEDULED" ? "Update schedule" : "Schedule"}
                    </button>
                    {s.status === "SCHEDULED" && (
                        <button
                            onClick={() => call("complete")}
                            disabled={busy}
                            className="rounded-lg bg-up px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                            Mark completed
                        </button>
                    )}
                    <button
                        onClick={() => confirm("Cancel and return the credit?") && call("cancel")}
                        disabled={busy}
                        className="rounded-lg border border-down/40 bg-white px-5 py-2.5 text-sm font-medium text-down transition hover:bg-down/5"
                    >
                        Cancel
                    </button>
                </div>
            )}
            {error && <p className="mt-3 text-sm text-down">{error}</p>}
        </div>
    );
}

export default function AdminSessionsPage() {
    const [view, setView] = useState<"open" | "history">("open");
    const [version, setVersion] = useState(0);
    const list = useAdminGet<{ items: Item[] }>(`/admin/sessions?view=${view}&v=${version}`);
    const experts = useAdminGet<{ items: Expert[] }>("/admin/premium/experts");

    return (
        <div className="space-y-6">
            <PageHeader title="Sessions" subtitle="Counselling requests. Set the expert, time and Zoom link." />

            <div className="flex gap-1 border-b border-line">
                {(["open", "history"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${view === v ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
                            }`}
                    >
                        {v === "open" ? "Open" : "History"}
                    </button>
                ))}
            </div>

            {list.loading && <p className="text-ink-soft">Loading...</p>}
            {list.error && <ErrorBox text={list.error} />}
            {list.data && list.data.items.length === 0 && <EmptyState text="Nothing here." />}
            {list.data?.items.map((s) => (
                <Card
                    key={s.id + s.status}
                    s={s}
                    experts={experts.data?.items ?? []}
                    onDone={() => setVersion((v) => v + 1)}
                />
            ))}
        </div>
    );
}