"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { EXPERT_TYPES } from "@/features/auth/schemas";
import PageTitle from "@/features/user/components/PageTitle";
import { CHANGE_FIELDS, DOC_FIELDS, FIELD_LABEL, TICKET_BADGE } from "@/features/support/fields";

type Ticket = {
    id: string;
    kind: "CHANGE" | "GENERAL";
    subject: string;
    message: string;
    field: string | null;
    oldValue: string | null;
    newDisplay: string | null;
    status: "OPEN" | "APPROVED" | "REJECTED" | "RESOLVED";
    adminReply: string | null;
    createdAt: string;
};

const field =
    "w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

function SupportInner() {
    const params = useSearchParams();
    const preset = params.get("field");

    const [kind, setKind] = useState<"CHANGE" | "GENERAL">(preset ? "CHANGE" : "CHANGE");
    const [which, setWhich] = useState(preset && FIELD_LABEL[preset] ? preset : "NAME");
    const [value, setValue] = useState("");
    const [type, setType] = useState("SEBI_RA");
    const [number, setNumber] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [items, setItems] = useState<Ticket[]>([]);

    const load = useCallback(async () => {
        const res = await api("/support");
        if (res.ok) setItems(res.data.items);
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const isDoc = DOC_FIELDS.includes(which);
    const hint = CHANGE_FIELDS.find((f) => f.value === which)?.hint;

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setMsg(null);

        const fd = new FormData();
        fd.append("kind", kind);
        fd.append("message", message);
        if (kind === "GENERAL") {
            fd.append("subject", subject);
        } else {
            fd.append("field", which);
            if (which === "CREDENTIAL") {
                fd.append("newValue", JSON.stringify({ expertType: type, credentialNumber: number }));
            } else if (!isDoc) {
                fd.append("newValue", value);
            }
            if (file) fd.append("document", file);
        }

        const res = await api("/support", { method: "POST", body: fd });
        if (res.ok) {
            setMsg({ ok: true, text: "Sent. We'll review it and reply here." });
            setValue("");
            setNumber("");
            setFile(null);
            setSubject("");
            setMessage("");
            await load();
        } else {
            setMsg({ ok: false, text: res.data?.message ?? "Could not send" });
        }
        setBusy(false);
    }

    return (
        <div className="space-y-8">
            <PageTitle title="Help & support" subtitle="Ask for help, or request a change to your verified details." />

            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                <div className="inline-flex rounded-full border border-line bg-white p-1">
                    {(["CHANGE", "GENERAL"] as const).map((k) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setKind(k)}
                            className={`rounded-full px-5 py-2 text-sm font-medium transition ${kind === k ? "bg-brand text-white" : "text-ink-soft hover:text-ink"
                                }`}
                        >
                            {k === "CHANGE" ? "Change request" : "General help"}
                        </button>
                    ))}
                </div>

                {kind === "CHANGE" ? (
                    <>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink">What do you want to change?</label>
                            <select value={which} onChange={(e) => setWhich(e.target.value)} className={field}>
                                {CHANGE_FIELDS.map((f) => (
                                    <option key={f.value} value={f.value}>
                                        {f.label}
                                    </option>
                                ))}
                            </select>
                            {hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
                        </div>

                        {which === "CREDENTIAL" && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
                                    {EXPERT_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    placeholder="Registration number (if any)"
                                    className={`${field} uppercase placeholder:normal-case`}
                                />
                            </div>
                        )}

                        {!isDoc && which !== "CREDENTIAL" && (
                            <input
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="New value"
                                className={`${field} ${which === "PAN" ? "uppercase placeholder:normal-case" : ""}`}
                            />
                        )}

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Supporting document {isDoc ? "(required)" : "(optional)"}
                            </label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand"
                            />
                        </div>
                    </>
                ) : (
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        maxLength={120}
                        placeholder="Subject"
                        className={field}
                    />
                )}

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder={kind === "CHANGE" ? "Why do you need this change? (at least 20 characters)" : "How can we help?"}
                    className={field}
                />

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                        {busy ? "Sending..." : "Send request"}
                    </button>
                    {msg && <span className={`text-sm ${msg.ok ? "text-up" : "text-down"}`}>{msg.text}</span>}
                </div>
            </form>

            {items.length > 0 && (
                <div>
                    <h2 className="mb-3 text-lg font-semibold text-ink">Your requests</h2>
                    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                        {items.map((t) => (
                            <div key={t.id} className="px-5 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="font-medium text-ink">
                                        {t.kind === "CHANGE" ? `Change: ${FIELD_LABEL[t.field ?? ""] ?? t.field}` : t.subject}
                                    </p>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${TICKET_BADGE[t.status]}`}>
                                        {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                                    </span>
                                </div>
                                {t.kind === "CHANGE" && t.newDisplay && (
                                    <p className="mt-1 text-sm text-ink-soft">
                                        {t.oldValue} → {t.newDisplay}
                                    </p>
                                )}
                                <p className="mt-1 text-sm text-ink-soft">{t.message}</p>
                                {t.adminReply && (
                                    <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm text-ink">
                                        <span className="text-ink-soft">Admin: </span>
                                        {t.adminReply}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ExpertSupportPage() {
    return (
        <Suspense fallback={<p className="text-ink-soft">Loading...</p>}>
            <SupportInner />
        </Suspense>
    );
}