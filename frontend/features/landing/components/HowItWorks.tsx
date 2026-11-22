"use client";

import Link from "next/link";
import { ArrowRight, Check, Crown, MessageSquare, Minus, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const STEPS = [
    {
        icon: UserPlus,
        title: "Create your free account",
        text: "Sign up with your Gmail address in under a minute. Free groups are open to everyone.",
    },
    {
        icon: ShieldCheck,
        title: "Verify your PAN",
        text: "A quick one-time check keeps the community real and helps keep out fake accounts.",
    },
    {
        icon: Sparkles,
        title: "Pick what you follow",
        text: "Choose your sectors and interests, and we suggest the stock groups that match.",
    },
    {
        icon: MessageSquare,
        title: "Join groups and chat",
        text: "Read live discussions, ask questions and share files with people who follow the same companies.",
    },
    {
        icon: Crown,
        title: "Go deeper with experts",
        text: "Upgrade to join premium groups with verified experts, webinars and counselling sessions.",
    },
];

type Cell = boolean | string;
const ROWS: { label: string; free: Cell; premium: Cell; elite: Cell }[] = [
    { label: "Free stock communities", free: true, premium: true, elite: true },
    { label: "Discussions, chat and news", free: true, premium: true, elite: true },
    { label: "Premium groups with experts", free: false, premium: "Up to 10", elite: "Up to 20" },
    { label: "Ask experts questions", free: false, premium: true, elite: true },
    { label: "Educational webinars", free: false, premium: true, elite: true },
    { label: "Personal counselling sessions", free: false, premium: false, elite: "2 sessions" },
    { label: "Priority support", free: false, premium: false, elite: true },
];

function Mark({ v }: { v: Cell }) {
    if (typeof v === "string") return <span className="text-xs font-semibold text-ink">{v}</span>;
    return v ? (
        <Check size={16} className="mx-auto text-up" />
    ) : (
        <Minus size={16} className="mx-auto text-ink-soft/40" />
    );
}

export default function HowItWorks() {
    const { user, loading } = useAuth();

    return (
        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-14">
            <p className="text-xs font-semibold tracking-wider text-brand uppercase">How it works</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink">
                From curious to confident in five steps
            </h2>

            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
                {/* Journey */}
                <div>
                    <ol className="relative">
                        <span aria-hidden className="absolute top-3 bottom-3 left-[19px] w-px bg-line" />
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <li
                                    key={s.title}
                                    className="ai-line relative flex gap-4 pb-7 last:pb-0"
                                    style={{ animationDelay: `${i * 70}ms` }}
                                >
                                    <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-brand shadow-sm">
                                        <Icon size={18} />
                                    </span>
                                    <div className="pt-0.5">
                                        <p className="font-heading text-[15px] font-semibold text-ink">
                                            <span className="mr-2 text-ink-soft/60 tabular-nums">{i + 1}.</span>
                                            {s.title}
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>

                    {/* Outside the list, so the vertical line does not run beside it */}
                    {!loading && !user && (
                        <Link
                            href="/signup"
                            className="mt-6 ml-14 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                        >
                            Create free account <ArrowRight size={15} />
                        </Link>
                    )}
                </div>

                {/* Free vs Premium */}
                <div className="self-start overflow-hidden rounded-2xl border border-line bg-surface">
                    <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] items-center border-b border-line bg-line/30 px-4 py-3 text-center text-xs font-semibold text-ink">
                        <span className="text-left text-ink-soft">What you get</span>
                        <span>Free</span>
                        <span className="text-brand">Premium</span>
                        <span className="text-amber-700">Elite</span>
                    </div>
                    {ROWS.map((r) => (
                        <div
                            key={r.label}
                            className="grid grid-cols-[1.6fr_repeat(3,1fr)] items-center border-b border-line/70 px-4 py-3 text-center last:border-b-0"
                        >
                            <span className="text-left text-[13px] text-ink">{r.label}</span>
                            <Mark v={r.free} />
                            <Mark v={r.premium} />
                            <Mark v={r.elite} />
                        </div>
                    ))}
                    <p className="border-t border-line bg-line/20 px-4 py-3 text-[11px] text-ink-soft">
                        Experts share education and views, not personalised investment advice. See current
                        prices on the Plans page after signing up.
                    </p>
                </div>
            </div>
        </section>
    );
}