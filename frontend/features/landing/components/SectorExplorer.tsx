"use client";

import Link from "next/link";
import {
    ArrowUpRight,
    Car,
    Cpu,
    Flame,
    Landmark,
    Layers,
    Pill,
    Radio,
    ShoppingCart,
    Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/lib/constants";
import { useLoginModal } from "./LandingShell";

/**
 * Static topics only: no data, no prices. Tile size and color are just for looks.
 * Classes are written out in full so Tailwind can see them.
 * Telecom is shown on phones only (lg:hidden), so the 2-column phone grid has no lonely tile.
 */
const SECTORS: {
    name: string;
    icon: LucideIcon;
    tone: string;
    place: string;
    topics: string[];
}[] = [
        {
            name: "Banking",
            icon: Landmark,
            tone: "bg-brand/15 text-brand hover:bg-brand/20",
            place: "col-span-2 lg:col-span-5 lg:col-start-1 lg:row-span-3 lg:row-start-1",
            topics: ["Quarterly results", "NPAs and asset quality", "Interest rate moves", "Loan growth"],
        },
        {
            name: "IT",
            icon: Cpu,
            tone: "bg-violet-100 text-violet-700 hover:bg-violet-200/70",
            place: "lg:col-span-4 lg:col-start-6 lg:row-span-3 lg:row-start-1",
            topics: ["Large deal wins", "AI spending", "Hiring and attrition"],
        },
        {
            name: "Energy",
            icon: Flame,
            tone: "bg-amber-100 text-amber-700 hover:bg-amber-200/70",
            place: "lg:col-span-3 lg:col-start-10 lg:row-span-3 lg:row-start-1",
            topics: ["Crude oil trends", "Refining margins", "Capex plans"],
        },
        {
            name: "Finance",
            icon: Wallet,
            tone: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200/70",
            place: "lg:col-span-3 lg:col-start-1 lg:row-span-3 lg:row-start-4",
            topics: ["NBFC outlook", "Insurance growth", "Mutual fund flows"],
        },
        {
            name: "Metals",
            icon: Layers,
            tone: "bg-stone-200/80 text-stone-700 hover:bg-stone-300/70",
            place: "lg:col-span-2 lg:col-start-4 lg:row-span-3 lg:row-start-4",
            topics: ["Steel demand", "Global prices"],
        },
        {
            name: "Auto",
            icon: Car,
            tone: "bg-sky-100 text-sky-700 hover:bg-sky-200/70",
            place: "lg:col-span-3 lg:col-start-6 lg:row-span-3 lg:row-start-4",
            topics: ["Monthly sales", "EV launches", "Festive demand"],
        },
        {
            name: "Pharma",
            icon: Pill,
            tone: "bg-rose-100 text-rose-700 hover:bg-rose-200/70",
            place: "lg:col-span-2 lg:col-start-9 lg:row-span-3 lg:row-start-4",
            topics: ["Drug approvals", "Export outlook"],
        },
        {
            name: "FMCG",
            icon: ShoppingCart,
            tone: "bg-up/15 text-up hover:bg-up/20",
            place: "lg:col-span-2 lg:col-start-11 lg:row-span-3 lg:row-start-4",
            topics: ["Rural demand", "Input costs"],
        },
        {
            name: "Telecom",
            icon: Radio,
            tone: "bg-teal-100 text-teal-700 hover:bg-teal-200/70",
            place: "lg:hidden",
            topics: ["5G rollout", "Tariff changes"],
        },
    ];

export default function SectorExplorer() {
    const { user } = useAuth();
    const { openLogin } = useLoginModal();

    const cls = (place: string, tone: string) =>
        `ai-line group relative flex min-h-[120px] flex-col justify-between gap-3 overflow-hidden rounded-xl p-4 text-left transition duration-300 hover:brightness-[0.97] ${place} ${tone}`;

    const inner = (s: (typeof SECTORS)[number]) => {
        const Icon = s.icon;
        return (
            <>
                {/* Faint corner icon, decoration only */}
                <Icon
                    aria-hidden
                    strokeWidth={1.25}
                    className="pointer-events-none absolute -right-3 -bottom-3 h-20 w-20 opacity-[0.12] transition duration-500 group-hover:scale-110 group-hover:-rotate-6 lg:h-24 lg:w-24"
                />

                <div className="relative">
                    <span className="font-heading text-base font-semibold">{s.name}</span>
                    <ul className="mt-2.5 space-y-1">
                        {s.topics.map((t) => (
                            <li key={t} className="flex items-center gap-2 text-xs font-medium opacity-80">
                                <span className="h-1 w-1 shrink-0 rounded-full bg-current" />
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Hover hint: laptops only, so it never overlaps the topics on phones */}
                <span className="relative hidden items-center gap-1 text-xs font-semibold opacity-0 transition duration-300 group-hover:opacity-100 lg:flex">
                    Join the talk <ArrowUpRight size={13} />
                </span>
            </>
        );
    };

    return (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink">What people talk about</h2>
            <p className="mt-1 text-sm text-ink-soft">
                Every sector has its own conversations. Here is a taste of what you will find.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 lg:h-[420px] lg:grid-cols-12 lg:grid-rows-6">
                {SECTORS.map((s, i) => {
                    const style = { animationDelay: `${i * 40}ms` };
                    return user ? (
                        <Link
                            key={s.name}
                            href={user.role === "USER" ? "/user/discover" : HOME_BY_ROLE[user.role]}
                            className={cls(s.place, s.tone)}
                            style={style}
                        >
                            {inner(s)}
                        </Link>
                    ) : (
                        <button
                            key={s.name}
                            type="button"
                            onClick={() => openLogin("/user/discover")}
                            className={cls(s.place, s.tone)}
                            style={style}
                        >
                            {inner(s)}
                        </button>
                    );
                })}
            </div>

            <p className="mt-3 text-[11px] text-ink-soft/80">
                Example topics for illustration. Tile size and color do not reflect market performance.
            </p>
        </section>
    );
}