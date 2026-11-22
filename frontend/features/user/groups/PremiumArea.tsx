"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Crown, Lock, UserX } from "lucide-react";
import { api } from "@/lib/api";
import ChatPanel from "./ChatPanel";
import type { StockItem } from "./types";

type Status = {
    hasExpert: boolean;
    experts: string[];
    members: number;
    unlocked: boolean;
    subscription: { tier: string; groupsUsed: number; groupLimit: number } | null;
    demand: number;
    requested: boolean;
};

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="flex-1 overflow-y-auto bg-[#efeee7] p-6">
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                    {icon}
                </div>
                <h2 className="mt-4 font-heading text-xl font-extrabold text-ink">{title}</h2>
                {children}
            </div>
        </div>
    );
}

const btn =
    "mt-6 block w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60";

export default function PremiumArea({ stock }: { stock: StockItem }) {
    const [s, setS] = useState<Status | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const load = useCallback(async () => {
        const res = await api(`/stocks/${encodeURIComponent(stock.symbol)}/premium`);
        if (res.ok) setS(res.data);
        else setError(res.data?.message ?? "Could not load premium details");
    }, [stock.symbol]);

    useEffect(() => {
        load();
    }, [load]);

    async function post(path: string) {
        setBusy(true);
        setError("");
        const res = await api(`/stocks/${encodeURIComponent(stock.symbol)}/${path}`, {
            method: "POST",
        });
        if (!res.ok) setError(res.data?.message ?? "Something went wrong");
        await load();
        setConfirming(false);
        setBusy(false);
    }

    if (!s) return <p className="p-6 text-sm text-ink-soft">{error || "Loading..."}</p>;

    if (s.unlocked) {
        return (
            <div className="flex min-h-0 flex-1 flex-col">
                {!s.hasExpert && (
                    <p className="shrink-0 border-b border-line bg-brand/5 px-4 py-2 text-center text-xs text-ink-soft">
                        Your expert is being replaced. You keep full access in the meantime.
                    </p>
                )}
                <ChatPanel
                    stock={{ ...stock, memberCount: s.members }}
                    channel="premium"
                    onLeave={async () => { }}
                />
            </div>
        );
    }

    const errorLine = error && <p className="mt-3 text-sm text-down">{error}</p>;

    if (!s.hasExpert) {
        return (
            <Card icon={<UserX size={24} />} title="Expert not available yet">
                <p className="mt-2 text-sm text-ink-soft">
                    No expert guides {stock.symbol} yet. Ask for one and we'll let experts know.
                </p>
                {s.demand > 0 && (
                    <p className="mt-2 text-xs text-ink-soft">
                        {s.demand} {s.demand === 1 ? "member has" : "members have"} asked for an expert.
                    </p>
                )}
                <button
                    onClick={() => post("expert-request")}
                    disabled={busy || s.requested}
                    className={btn}
                >
                    {s.requested ? "Requested ✓" : busy ? "Please wait..." : "Request expert"}
                </button>
                {errorLine}
            </Card>
        );
    }

    if (!s.subscription) {
        return (
            <Card icon={<Lock size={24} />} title="Premium group">
                <p className="mt-2 text-sm text-ink-soft">
                    Guided by {s.experts.join(", ")}. Get a Premium or Elite plan to join.
                </p>
                <Link href="/user/premium" className={btn}>
                    See plans
                </Link>
            </Card>
        );
    }

    const full = s.subscription.groupsUsed >= s.subscription.groupLimit;
    return (
        <Card icon={<Crown size={24} />} title={`Unlock ${stock.symbol} premium`}>
            <p className="mt-2 text-sm text-ink-soft">Guided by {s.experts.join(", ")}.</p>
            <p className="mt-2 text-xs text-ink-soft">
                {s.subscription.groupsUsed} of {s.subscription.groupLimit} premium groups used.
                {confirming && " Your choice can't be changed until your plan ends."}
            </p>
            {full ? (
                <p className="mt-4 text-sm text-down">You've used all your premium group slots.</p>
            ) : (
                <button
                    onClick={() => (confirming ? post("premium/unlock") : setConfirming(true))}
                    disabled={busy}
                    className={btn}
                >
                    {busy ? "Unlocking..." : confirming ? "Confirm unlock" : "Unlock this group"}
                </button>
            )}
            {errorLine}
        </Card>
    );
}