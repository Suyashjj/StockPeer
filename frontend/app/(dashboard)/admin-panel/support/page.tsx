"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { useAdminGet } from "@/features/admin/useAdminGet";
import { EmptyState, ErrorBox, formatDate, PageHeader } from "@/features/admin/components/ReviewParts";
import { FIELD_LABEL, TICKET_BADGE } from "@/features/support/fields";

type Item = {
    id: string;
    kind: "CHANGE" | "GENERAL";
    subject: string;
    message: string;
    field: string | null;
    oldValue: string | null;
    newDisplay: string | null;
    documentUrl: string | null;
    reverifies: boolean;
    status: "OPEN" | "APPROVED" | "REJECTED" | "RESOLVED";
    adminReply: string | null;
    createdAt: string;
    user: { name: string; email: string; role: string };
};

const box =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

function Card({ t, onDone }: { t: Item; onDone: () => void }) {
    const [text, setText] = useState("");
    const [rejecting, setRejecting] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const open = t.status === "OPEN";

    async function call(path: string, body: unknown) {
        setBusy(true);
        setError("");
        const res = await api(`/admin/support/${t.id}/${path}`, { method: "POST", body });
        if (res.ok) onDone();
        else {
            setError(res.data?.message ?? "Something went wrong");
            setBusy(false);
        }
    }

    return (
        <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-semibold text-ink">
                        {t.kind === "CHANGE" ? `Change: ${FIELD_LABEL[t.field ?? ""] ?? t.field}` : t.subject}
                    </p>
                    <p className="text-xs text-ink-soft">
                        {t.user.name} · {t.user.email} · {t.user.role} · {formatDate(t.createdAt)}
                    </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${TICKET_BADGE[t.status]}`}>
                    {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                </span>
            </div>

            {t.kind === "CHANGE" && (
                <div className="mt-3 rounded-xl bg-paper p-4 text-sm">
                    <p className="text-ink-soft">
                        Current: <span className="font-medium text-ink">{t.oldValue}</span>
                    </p>
                    {t.newDisplay && (
                        <p className="mt-1 text-ink-soft">
                            Requested: <span className="font-medium text-ink">{t.newDisplay}</span>
                        </p>
                    )}
                    {t.documentUrl && (
                        <a href={t.documentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-medium text-brand hover:underline">
                            <ExternalLink size={14} /> Open document
                        </a>
                    )}
                </div>
            )}

            <p className="mt-3 text-sm text-ink">{t.message}</p>
            {t.adminReply && !open && (
                <p className="mt-2 text-sm text-ink-soft">Reply: {t.adminReply}</p>
            )}

            {open && t.kind === "CHANGE" && (
                <div className="mt-4 space-y-3">
                    {t.reverifies && (
                        <p className="text-xs text-ink-soft">
                            Approving applies the change and sends this expert back to Pending until you review them again.
                        </p>
                    )}
                    {rejecting && (
                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={400} placeholder="Reason (shown to the expert)" className={box} />
                    )}
                    <div className="flex gap-3">
                        {rejecting ? (
                            <>
                                <button onClick={() => call("decision", { approve: false, reason: text })} disabled={busy} className="rounded-lg bg-down px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                                    {busy ? "Rejecting..." : "Confirm rejection"}
                                </button>
                                <button onClick={() => setRejecting(false)} className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink">
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => call("decision", { approve: true })} disabled={busy} className="rounded-lg bg-up px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                                    {busy ? "Applying..." : "Approve and apply"}
                                </button>
                                <button onClick={() => setRejecting(true)} className="rounded-lg border border-down/40 bg-white px-5 py-2.5 text-sm font-medium text-down hover:bg-down/5">
                                    Reject
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {open && t.kind === "GENERAL" && (
                <div className="mt-4 space-y-3">
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} placeholder="Your reply" className={box} />
                    <button onClick={() => call("reply", { reply: text })} disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                        {busy ? "Sending..." : "Send reply and resolve"}
                    </button>
                </div>
            )}
            {error && <p className="mt-3 text-sm text-down">{error}</p>}
        </div>
    );
}

export default function AdminSupportPage() {
    const [view, setView] = useState<"open" | "history">("open");
    const [version, setVersion] = useState(0);
    const { data, loading, error } = useAdminGet<{ items: Item[] }>(`/admin/support?view=${view}&v=${version}`);

    return (
        <div className="space-y-6">
            <PageHeader title="Support" subtitle="Change requests and help tickets." />
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
            {loading && <p className="text-ink-soft">Loading...</p>}
            {error && <ErrorBox text={error} />}
            {data && data.items.length === 0 && <EmptyState text="Nothing here." />}
            {data?.items.map((t) => (
                <Card key={t.id + t.status} t={t} onDone={() => setVersion((v) => v + 1)} />
            ))}
        </div>
    );
}