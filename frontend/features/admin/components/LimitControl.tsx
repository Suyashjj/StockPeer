"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function LimitControl({
    groupId,
    experts,
    max,
    onChanged,
}: {
    groupId: string;
    experts: number;
    max: number;
    onChanged: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const next = max === 2 ? 3 : 2;

    async function change() {
        setBusy(true);
        setError("");
        const res = await api(`/admin/premium/groups/${groupId}/max-experts`, {
            method: "PATCH",
            body: { maxExperts: next },
        });
        if (res.ok) onChanged();
        else setError(res.data?.message ?? "Could not change the limit");
        setBusy(false);
    }

    return (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
            <span>
                Experts {experts}/{max}
            </span>
            <button
                onClick={change}
                disabled={busy}
                className="font-medium text-brand hover:underline disabled:opacity-50"
            >
                {next === 3 ? "Raise limit to 3" : "Lower limit to 2"}
            </button>
            {error && <span className="text-down">{error}</span>}
        </div>
    );
}