"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Crown, Sparkles, Users } from "lucide-react";
import { setJoined } from "../groups/joinApi";
import PanGateDialog from "../groups/PanGateDialog";

export type CardStock = {
    symbol: string;
    name: string;
    members?: number;
    reason?: string;
    joined?: boolean;
    messages?: number;
    tag?: { label: string; tone: "gold" | "green" };
};

const TINTS = [
    "bg-brand/10 text-brand",
    "bg-up/10 text-up",
    "bg-down/10 text-down",
    "bg-amber-100 text-amber-700",
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
];

export const tintFor = (symbol: string) => {
    let h = 0;
    for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) % 997;
    return TINTS[h % TINTS.length];
};

export const chatHref = (symbol: string) => `/user/chats/${encodeURIComponent(symbol)}`;

/**
 * tone="colored" (default) keeps the old multi-color look, so other pages that
 * import Avatar don't change. tone="neutral" is the calm gradient monogram.
 */
export function Avatar({
    symbol,
    size = "h-11 w-11",
    rounded = "rounded-xl",
    tone = "colored",
    text = "text-xs",
}: {
    symbol: string;
    size?: string;
    rounded?: string;
    tone?: "colored" | "neutral";
    text?: string;
}) {
    const color =
        tone === "neutral"
            ? "bg-gradient-to-br from-brand/[0.16] to-brand/[0.05] text-brand ring-1 ring-brand/15"
            : tintFor(symbol);
    return (
        <div
            className={`flex ${size} shrink-0 items-center justify-center ${rounded} font-heading ${text} font-semibold ${color}`}
        >
            {symbol.slice(0, 2)}
        </div>
    );
}

const TAG_TONES = {
    gold: "bg-amber-50 text-amber-700",
    green: "bg-up/10 text-up",
} as const;

function useJoin(s: CardStock) {
    const [joined, setJoinedState] = useState(!!s.joined);
    const [members, setMembers] = useState(s.members);
    const [busy, setBusy] = useState(false);
    const [gate, setGate] = useState<string | null>(null);

    async function join() {
        setBusy(true);
        const r = await setJoined(s.symbol, true);
        if (r.ok) {
            setJoinedState(true);
            setMembers(r.stock.memberCount);
            window.dispatchEvent(new Event("chats:changed"));
        } else if (r.panRequired) {
            setGate(r.panStatus);
        }
        setBusy(false);
    }

    return { joined, members, busy, gate, setGate, join };
}

/** Grid card. `featured` makes it the wide "Top match" card. */
export default function StockCard({
    s,
    index = 0,
    featured = false,
}: {
    s: CardStock;
    index?: number;
    featured?: boolean;
}) {
    const { joined, members, busy, gate, setGate, join } = useJoin(s);

    const crown = s.tag && (
        <span
            title={s.tag.label}
            className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md ${TAG_TONES[s.tag.tone]}`}
        >
            <Crown size={11} />
            <span className="sr-only">{s.tag.label}</span>
        </span>
    );

    return (
        // Wrapper runs the entrance animation. The dialog sits outside the lifting
        // card, so the hover transform can never trap it inside the card.
        <div
            className={`ai-line h-full ${featured ? "sm:col-span-2" : ""}`}
            style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
        >
            {featured ? (
                <div className="relative flex h-full min-w-0 flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] via-surface to-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_10px_32px_rgba(47,95,208,0.12)]">
                    <span className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-brand/10 blur-2xl" />

                    <Link href={chatHref(s.symbol)} className="relative block">
                        <div className="flex items-center gap-3.5">
                            <Avatar symbol={s.symbol} size="h-12 w-12" rounded="rounded-xl" tone="neutral" text="text-sm" />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <p className="truncate font-heading text-base font-semibold text-ink">{s.symbol}</p>
                                    {crown}
                                    <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                                        <Sparkles size={10} /> Top match
                                    </span>
                                </div>
                                <p className="truncate text-sm text-ink-soft">{s.name}</p>
                            </div>
                        </div>
                        {s.reason && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.reason}</p>}
                    </Link>

                    <div className="relative flex items-center justify-between gap-3">
                        {members !== undefined ? (
                            <span className="flex items-center gap-1.5 text-sm text-ink-soft tabular-nums">
                                <Users size={15} /> {members} members
                            </span>
                        ) : (
                            <span />
                        )}
                        {joined ? (
                            <Link
                                href={chatHref(s.symbol)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
                            >
                                Open <ArrowUpRight size={15} />
                            </Link>
                        ) : (
                            <button
                                onClick={join}
                                disabled={busy}
                                className="inline-flex h-9 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                            >
                                {busy ? "Joining..." : "Join group"}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex h-full min-w-0 flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_8px_28px_rgba(31,41,55,0.07)]">
                    <Link href={chatHref(s.symbol)} className="block">
                        <div className="flex items-start gap-3">
                            <Avatar symbol={s.symbol} size="h-10 w-10" tone="neutral" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="truncate text-sm font-semibold text-ink">{s.symbol}</p>
                                    {crown}
                                </div>
                                <p className="truncate text-xs text-ink-soft">{s.name}</p>
                            </div>
                            {members !== undefined && (
                                <span className="flex shrink-0 items-center gap-1 pt-0.5 text-xs text-ink-soft tabular-nums">
                                    <Users size={13} /> {members}
                                </span>
                            )}
                        </div>
                    </Link>

                    <div className="flex h-8 items-center justify-between gap-3">
                        <p title={s.reason} className="min-w-0 flex-1 truncate text-xs text-ink-soft">
                            {s.reason ?? ""}
                        </p>
                        {joined ? (
                            <Link
                                href={chatHref(s.symbol)}
                                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                            >
                                Open <ArrowUpRight size={13} />
                            </Link>
                        ) : (
                            <button
                                onClick={join}
                                disabled={busy}
                                className="inline-flex h-8 shrink-0 items-center rounded-lg bg-brand/10 px-3.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white disabled:opacity-60"
                            >
                                {busy ? "Joining..." : "Join"}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {gate && <PanGateDialog panStatus={gate} onClose={() => setGate(null)} />}
        </div>
    );
}

/** One line of the ranked "Active this week" list. */
export function RankedRow({
    s,
    rank,
    max,
    index = 0,
}: {
    s: CardStock;
    rank: number;
    max: number;
    index?: number;
}) {
    const { joined, members, busy, gate, setGate, join } = useJoin(s);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const hasMsgs = s.messages !== undefined;
    const pct = hasMsgs && max > 0 ? Math.max(s.messages! > 0 ? 6 : 0, Math.round((s.messages! / max) * 100)) : 0;
    const label = hasMsgs ? `${s.messages} ${s.messages === 1 ? "msg" : "msgs"}` : (s.reason ?? "");

    return (
        <div className="ai-line" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
            <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-line/40">
                <span
                    className={`w-5 shrink-0 text-center font-heading text-sm font-semibold tabular-nums ${rank === 1 ? "text-amber-600" : "text-ink-soft/60"
                        }`}
                >
                    {rank}
                </span>

                <Link href={chatHref(s.symbol)} title={s.reason} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar symbol={s.symbol} size="h-10 w-10" tone="neutral" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-ink">{s.symbol}</p>
                            {s.tag && (
                                <span
                                    title={s.tag.label}
                                    className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md ${TAG_TONES[s.tag.tone]}`}
                                >
                                    <Crown size={11} />
                                    <span className="sr-only">{s.tag.label}</span>
                                </span>
                            )}
                        </div>
                        <p className="truncate text-xs text-ink-soft">{s.name}</p>
                    </div>
                </Link>

                <div className="hidden w-36 shrink-0 sm:block">
                    <p className="truncate text-[11px] text-ink-soft tabular-nums">{label}</p>
                    {hasMsgs && (
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-brand/60 to-brand transition-[width] duration-700 ease-out motion-reduce:transition-none"
                                style={{ width: `${ready ? pct : 0}%` }}
                            />
                        </div>
                    )}
                </div>

                <span className="hidden w-12 shrink-0 items-center gap-1 text-xs text-ink-soft tabular-nums md:flex">
                    {members !== undefined && (
                        <>
                            <Users size={13} /> {members}
                        </>
                    )}
                </span>

                {joined ? (
                    <Link
                        href={chatHref(s.symbol)}
                        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                    >
                        Open <ArrowUpRight size={13} />
                    </Link>
                ) : (
                    <button
                        onClick={join}
                        disabled={busy}
                        className="inline-flex h-8 shrink-0 items-center rounded-lg bg-brand/10 px-3.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white disabled:opacity-60"
                    >
                        {busy ? "Joining..." : "Join"}
                    </button>
                )}
            </div>

            {gate && <PanGateDialog panStatus={gate} onClose={() => setGate(null)} />}
        </div>
    );
}