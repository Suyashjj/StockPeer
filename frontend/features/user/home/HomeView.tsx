"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    BadgeCheck,
    Bell,
    CalendarClock,
    ChevronRight,
    Clock,
    Compass,
    Crown,
    Flame,
    Lightbulb,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    Users,
    Video,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Row from "./Row";
import MarketStatus from "./MarketStatus";
import HeroChart from "./HeroChart";
import CountUp from "./CountUp";
import StockCard, { Avatar, RankedRow, chatHref, type CardStock } from "./StockCard";

type Home = {
    panStatus: string;
    plan: { tier: string; endsAt: string } | null;
    completion: { percent: number; missing: string[] };
    continue: { id: string; symbol: string; name: string; unread?: number; lastMessage?: { body: string; senderName: string; mine: boolean } | null }[];
    suggested: { symbol: string; name: string; members: number; reason: string }[];
    trending: { symbol: string; name: string; members: number; messages7d: number; joined: boolean }[];
    premium: { symbol: string; name: string; experts: number; unlocked: boolean }[];
    recent: { symbol: string; name: string; members: number; joined: boolean }[];
    session: { topic: string; scheduledAt: string; expert: string | null } | null;
};

const PAN = {
    NOT_SUBMITTED: ["PAN not verified", "bg-line text-ink-soft"],
    PENDING: ["PAN under review", "bg-amber-50 text-amber-700"],
    VERIFIED: ["PAN verified", "bg-up/10 text-up"],
    REJECTED: ["PAN rejected", "bg-down/10 text-down"],
} as const;

// 1 wide "Top match" card + 4 compact cards = no orphan card in 2 or 3 column layouts
const SUGGESTED_LIMIT = 5;

// Keyframes live here so globals.css stays untouched. Used through motion-safe: only.
const KEYFRAMES = `
@keyframes sp-drift {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(-34px, 22px, 0); }
}
@keyframes sp-sheen {
    0% { transform: translateX(-140%) skewX(-18deg); }
    40%, 100% { transform: translateX(420%) skewX(-18deg); }
}
`;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// "24 people from your groups are here" -> "24 from your groups"
const shorten = (r: string) => r.replace(/^(\d+) people from your groups are here$/i, "$1 from your groups");

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3.5 flex items-center justify-between">
                <h3 className="font-heading text-[13px] font-semibold tracking-wide text-ink">{title}</h3>
                {action}
            </div>
            {children}
        </div>
    );
}

function HeroStat({
    value,
    label,
    icon,
    tone,
}: {
    value: number;
    label: string;
    icon: React.ReactNode;
    tone: string;
}) {
    return (
        <div className="flex min-w-[9.5rem] flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3 backdrop-blur-sm sm:max-w-[12rem]">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
            <div>
                <p className="font-heading text-xl leading-none font-semibold tabular-nums">
                    <CountUp value={value} />
                </p>
                <p className="mt-1 text-[11px] text-white/60">{label}</p>
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="animate-pulse space-y-8">
            <div className="h-56 rounded-3xl bg-line/60" />
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-4">
                    <div className="h-5 w-40 rounded bg-line" />
                    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-28 rounded-2xl bg-line/60" />
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-32 rounded-2xl bg-line/60" />
                    <div className="h-32 rounded-2xl bg-line/60" />
                </div>
            </div>
        </div>
    );
}

export default function HomeView() {
    const { user } = useAuth();
    const [d, setD] = useState<Home | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            const res = await api("/home");
            if (res.ok) setD(res.data);
            else setError(res.data?.message ?? "Could not load your home page");
        })();
    }, []);

    if (error) return <p className="rounded-xl border border-down/30 bg-down/5 p-4 text-sm text-down">{error}</p>;
    if (!d) return <Skeleton />;

    const now = new Date();
    const hour = now.getHours();
    const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const today = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const [panLabel, panCls] = PAN[d.panStatus as keyof typeof PAN] ?? PAN.NOT_SUBMITTED;

    const attention = d.continue.filter((c) => (c.unread ?? 0) > 0);
    const totalUnread = attention.reduce((sum, c) => sum + (c.unread ?? 0), 0);

    // Stats built only from data this page already receives
    const joinedSymbols = new Set<string>([
        ...d.continue.map((c) => c.symbol),
        ...d.recent.filter((r) => r.joined).map((r) => r.symbol),
        ...d.trending.filter((t) => t.joined).map((t) => t.symbol),
    ]);
    const expertGroups = d.plan ? d.premium.length : null;

    const daysLeft = d.plan
        ? Math.max(0, Math.ceil((new Date(d.plan.endsAt).getTime() - now.getTime()) / 86_400_000))
        : 0;
    const planName = d.plan ? (d.plan.tier === "ELITE" ? "Elite" : "Premium") : "Free";

    // Merge "Most active" and "Premium" into one ranked list: busiest first
    const premiumMap = new Map(d.plan ? d.premium.map((p) => [p.symbol, p]) : []);
    const groups: CardStock[] = [...d.trending]
        .sort((a, b) => b.messages7d - a.messages7d)
        .map((t) => {
            const p = premiumMap.get(t.symbol);
            premiumMap.delete(t.symbol);
            return {
                symbol: t.symbol,
                name: t.name,
                members: t.members,
                joined: t.joined,
                messages: t.messages7d,
                reason: `${t.messages7d} ${t.messages7d === 1 ? "msg" : "msgs"} this week${p ? ` · ${plural(p.experts, "expert")}` : ""}`,
                tag: p ? { label: p.unlocked ? "Premium · Unlocked" : "Premium", tone: "gold" as const } : undefined,
            };
        });
    premiumMap.forEach((p) =>
        groups.push({
            symbol: p.symbol,
            name: p.name,
            joined: true,
            reason: plural(p.experts, "expert"),
            tag: { label: p.unlocked ? "Premium · Unlocked" : "Premium", tone: "gold" as const },
        }),
    );
    const maxMsgs = Math.max(0, ...groups.map((g) => g.messages ?? 0));

    const suggested = d.suggested.slice(0, SUGGESTED_LIMIT);

    return (
        <div className="space-y-9">
            <style>{KEYFRAMES}</style>

            {/* Hero */}
            <header className="ai-line relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink to-[#14224a] p-6 text-white shadow-[0_24px_50px_-24px_rgba(15,26,51,0.6)] sm:p-8">
                {/* dot grid */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                    }}
                />
                {/* drifting glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -right-10 h-72 w-72 rounded-full bg-brand/40 blur-3xl motion-safe:[animation:sp-drift_14s_ease-in-out_infinite]"
                />
                {/* decorative chart */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-0 right-0 hidden h-full w-3/5 md:block"
                    style={{
                        maskImage: "linear-gradient(to right, transparent, black 40%)",
                        WebkitMaskImage: "linear-gradient(to right, transparent, black 40%)",
                    }}
                >
                    <HeroChart />
                </div>

                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-xs font-medium tracking-wide text-white/60">{today}</p>
                        <MarketStatus dark />
                    </div>

                    <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-[34px]">
                        {hello}, {user?.name?.split(" ")[0]}
                    </h1>
                    <p className="mt-1.5 text-sm text-white/65">
                        {totalUnread > 0
                            ? `You have ${plural(totalUnread, "unread message")} across your groups.`
                            : "Here's what's happening across your groups."}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                        <Link
                            href="/user/discover"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-white/90"
                        >
                            <Compass size={16} /> Discover groups
                        </Link>
                        <Link
                            href="/user/chats"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                        >
                            <MessageSquare size={16} /> My chats
                        </Link>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <HeroStat
                            value={joinedSymbols.size}
                            label="Groups joined"
                            icon={<Users size={17} />}
                            tone="bg-white/10 text-sky-200"
                        />
                        <HeroStat
                            value={totalUnread}
                            label="Unread"
                            icon={<Bell size={17} />}
                            tone={totalUnread > 0 ? "bg-rose-400/20 text-rose-200" : "bg-white/10 text-white/60"}
                        />
                        {expertGroups !== null && (
                            <HeroStat
                                value={expertGroups}
                                label="Expert groups"
                                icon={<BadgeCheck size={17} />}
                                tone="bg-amber-300/20 text-amber-200"
                            />
                        )}
                    </div>
                </div>
            </header>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
                {/* Main column */}
                <div className="min-w-0 space-y-9">
                    {d.recent.length > 0 && (
                        <Row
                            title="Recently viewed"
                            icon={<Clock size={15} />}
                            tone="neutral"
                            className="flex flex-wrap gap-2.5"
                        >
                            {d.recent.map((s, i) => (
                                <Link
                                    key={s.symbol}
                                    href={chatHref(s.symbol)}
                                    style={{ animationDelay: `${i * 50}ms` }}
                                    className="ai-line flex items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pr-4 pl-1.5 transition hover:border-brand/40 hover:bg-white"
                                >
                                    <Avatar symbol={s.symbol} size="h-8 w-8" rounded="rounded-full" tone="neutral" />
                                    <span className="leading-tight">
                                        <span className="block text-[13px] font-semibold text-ink">{s.symbol}</span>
                                        <span className="block text-[11px] text-ink-soft">
                                            {s.joined ? "Joined" : plural(s.members, "member")}
                                        </span>
                                    </span>
                                </Link>
                            ))}
                        </Row>
                    )}

                    {suggested.length > 0 ? (
                        <Row
                            title="Suggested for you"
                            icon={<Sparkles size={15} />}
                            tone="brand"
                            count={suggested.length}
                            seeAll={{ href: "/user/discover", label: "See all in Discover" }}
                        >
                            {suggested.map((s, i) => (
                                <StockCard
                                    key={s.symbol}
                                    index={i}
                                    featured={i === 0}
                                    s={{ ...s, reason: i === 0 ? s.reason : shorten(s.reason) }}
                                />
                            ))}
                        </Row>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-soft">
                            Join a group or add your sectors of interest, and suggestions will appear here.
                        </p>
                    )}

                    {groups.length > 0 && (
                        <Row
                            title="Active this week"
                            icon={<Flame size={15} />}
                            tone="fire"
                            count={groups.length}
                            className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface"
                        >
                            {groups.map((s, i) => (
                                <RankedRow key={s.symbol} s={s} rank={i + 1} max={maxMsgs} index={i} />
                            ))}
                        </Row>
                    )}
                </div>

                {/* Side column */}
                <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
                    {d.plan ? (
                        <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-surface to-surface p-5">
                            {/* slow light sweep */}
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:[animation:sp-sheen_7s_ease-in-out_infinite]"
                            />
                            <div className="relative">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                                        <Crown size={19} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-heading text-[15px] font-semibold text-ink">{planName} plan</p>
                                        <p className={`text-xs ${daysLeft <= 14 ? "font-medium text-down" : "text-ink-soft"}`}>
                                            {plural(daysLeft, "day")} left
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${panCls}`}>
                                        <ShieldCheck size={13} /> {panLabel}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-amber-200/50 pt-3 text-xs text-ink-soft">
                                    <span>
                                        Active until{" "}
                                        <span className="font-medium text-ink">
                                            {new Date(d.plan.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                    </span>
                                    {daysLeft <= 14 && (
                                        <Link href="/user/premium" className="font-medium text-brand hover:underline">
                                            Renew
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Panel title="Your account">
                            <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${panCls}`}>
                                    <ShieldCheck size={13} /> {panLabel}
                                </span>
                                <span className="rounded-full bg-line px-2.5 py-1 text-xs font-medium text-ink-soft">Free plan</span>
                            </div>
                            <Link href="/user/premium" className="mt-3.5 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                                Explore plans <ChevronRight size={13} />
                            </Link>
                        </Panel>
                    )}

                    {d.session && (
                        <Panel title="Upcoming session">
                            <div className="flex items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-up/10 text-up">
                                    <CalendarClock size={18} />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">{d.session.topic}</p>
                                    <p className="mt-0.5 text-xs text-ink-soft">
                                        {new Date(d.session.scheduledAt).toLocaleString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                        {d.session.expert ? ` · ${d.session.expert}` : ""}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/user/sessions"
                                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-sm font-medium text-white transition hover:opacity-90"
                            >
                                <Video size={15} /> Open session
                            </Link>
                        </Panel>
                    )}

                    {attention.length > 0 && (
                        <Panel
                            title="Needs your attention"
                            action={
                                <Link href="/user/chats" className="text-xs font-medium text-brand hover:underline">
                                    All chats
                                </Link>
                            }
                        >
                            <div className="-mx-2 space-y-0.5">
                                {attention.slice(0, 4).map((s) => (
                                    <Link
                                        key={s.id}
                                        href={chatHref(s.symbol)}
                                        className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-line/50"
                                    >
                                        <Avatar symbol={s.symbol} size="h-9 w-9" tone="neutral" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-semibold text-ink">{s.symbol}</p>
                                            <p className="truncate text-xs text-ink-soft">
                                                {s.lastMessage
                                                    ? `${s.lastMessage.mine ? "You" : s.lastMessage.senderName}: ${s.lastMessage.body}`
                                                    : s.name}
                                            </p>
                                        </div>
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                                            {s.unread}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </Panel>
                    )}

                    {d.completion.percent < 100 && (
                        <Link
                            href="/user/profile"
                            className="block rounded-2xl border border-line bg-surface p-5 transition hover:border-brand/40"
                        >
                            <div className="flex items-center justify-between">
                                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                                    <Lightbulb size={16} className="text-brand" /> Complete your profile
                                </p>
                                <span className="text-xs font-semibold text-brand tabular-nums">{d.completion.percent}%</span>
                            </div>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${d.completion.percent}%` }} />
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                                Add {d.completion.missing.slice(0, 3).join(", ")} for better suggestions.
                            </p>
                        </Link>
                    )}
                </aside>
            </div>
        </div>
    );
}