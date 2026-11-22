"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

export function formatDate(value?: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
        </div>
    );
}

export function BackLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-ink"
        >
            <ArrowLeft size={14} />
            {label}
        </Link>
    );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_30px_rgba(31,41,55,0.05)]">
            {title && <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">{title}</h2>}
            {children}
        </section>
    );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[180px_1fr]">
            <dt className="text-sm text-ink-soft">{label}</dt>
            <dd className="text-sm font-medium break-words text-ink">{children}</dd>
        </div>
    );
}

export function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-ink-soft">
            {text}
        </div>
    );
}

export function ErrorBox({ text }: { text: string }) {
    return (
        <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{text}</p>
    );
}

// Shows an image; if it's a PDF (or fails to load), the link still works
export function DocumentPreview({ label, url }: { label: string; url: string }) {
    const [broken, setBroken] = useState(false);
    return (
        <div>
            <p className="mb-2 text-sm font-medium text-ink">{label}</p>
            {!broken && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={url}
                    alt={label}
                    onError={() => setBroken(true)}
                    className="max-h-80 w-full rounded-xl border border-line bg-white object-contain"
                />
            )}
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
                <ExternalLink size={14} />
                Open full size
            </a>
        </div>
    );
}

// Approve / Reject with a required reason. `endpoint` is the full decision URL.
export function DecisionPanel({
    endpoint,
    backHref,
    approveLabel,
}: {
    endpoint: string;
    backHref: string;
    approveLabel: string;
}) {
    const router = useRouter();
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function decide(approve: boolean) {
        if (!approve && !reason.trim()) {
            setError("Write a reason, so the person knows what to fix.");
            return;
        }
        setBusy(true);
        setError("");
        const res = await api(endpoint, {
            method: "POST",
            body: approve ? { approve: true } : { approve: false, reason: reason.trim() },
        });
        if (res.ok) {
            router.push(backHref);
            return;
        }
        const errs = res.data?.errors as Record<string, string[]> | undefined;
        setError(
            (errs ? Object.values(errs).flat()[0] : undefined) ??
            res.data?.message ??
            "Something went wrong"
        );
        setBusy(false);
    }

    return (
        <Card title="Decision">
            {rejecting ? (
                <div className="space-y-3">
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        maxLength={300}
                        placeholder="Reason for rejection (shown to the person)"
                        className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/20"
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
                            disabled={busy}
                            className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button
                        onClick={() => decide(true)}
                        disabled={busy}
                        className="rounded-lg bg-up px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                        {busy ? "Approving..." : approveLabel}
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
        </Card>
    );
}