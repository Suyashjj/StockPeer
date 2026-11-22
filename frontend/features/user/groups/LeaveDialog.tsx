"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LeaveDialog({
    symbol,
    onConfirm,
    onClose,
}: {
    symbol: string;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}) {
    const [busy, setBusy] = useState(false);

    async function confirm() {
        setBusy(true);
        await onConfirm();
        setBusy(false);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
            onClick={busy ? undefined : onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-down/10 text-down">
                    <LogOut size={22} />
                </div>
                <h2 className="mt-4 font-heading text-xl font-bold text-ink">Leave {symbol}?</h2>
                <p className="mt-2 text-sm text-ink-soft">
                    You'll stop receiving messages and won't be able to read this chat until you
                    join again.
                </p>
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="flex-1 rounded-lg border border-line bg-white py-2.5 text-sm font-medium text-ink transition hover:border-brand disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirm}
                        disabled={busy}
                        className="flex-1 rounded-lg bg-down py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                        {busy ? "Leaving..." : "Leave group"}
                    </button>
                </div>
            </div>
        </div>
    );
}