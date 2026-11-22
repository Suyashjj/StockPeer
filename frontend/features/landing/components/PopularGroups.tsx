"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/lib/constants";
import { useLoginModal } from "./LandingShell";

type Sector = "Banking" | "IT" | "Energy" | "FMCG";

// Static on purpose: no prices, no member counts. Symbols must exist in your stocks table.
const GROUPS: { symbol: string; name: string; sector: Sector }[] = [
    { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy" },
    { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT" },
    { symbol: "INFY", name: "Infosys", sector: "IT" },
    { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
    { symbol: "SBIN", name: "State Bank of India", sector: "Banking" },
    { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking" },
    { symbol: "ITC", name: "ITC Limited", sector: "FMCG" },
    { symbol: "INDUSINDBK", name: "IndusInd Bank", sector: "Banking" },
];

const FILTERS: ("All" | Sector)[] = ["All", "Banking", "IT", "Energy", "FMCG"];

const TONE: Record<Sector, { tile: string; pill: string; glow: string }> = {
    Banking: {
        tile: "from-brand/20 to-brand/5 text-brand ring-brand/20",
        pill: "bg-brand/10 text-brand",
        glow: "hover:shadow-[0_12px_32px_rgba(47,95,208,0.16)] hover:border-brand/30",
    },
    IT: {
        tile: "from-violet-200/70 to-violet-50 text-violet-700 ring-violet-200",
        pill: "bg-violet-100 text-violet-700",
        glow: "hover:shadow-[0_12px_32px_rgba(124,58,237,0.16)] hover:border-violet-300/60",
    },
    Energy: {
        tile: "from-amber-200/70 to-amber-50 text-amber-700 ring-amber-200",
        pill: "bg-amber-100 text-amber-700",
        glow: "hover:shadow-[0_12px_32px_rgba(217,119,6,0.16)] hover:border-amber-300/60",
    },
    FMCG: {
        tile: "from-up/20 to-up/5 text-up ring-up/20",
        pill: "bg-up/10 text-up",
        glow: "hover:shadow-[0_12px_32px_rgba(30,142,90,0.16)] hover:border-up/30",
    },
};

const chatPath = (symbol: string) => `/user/chats/${encodeURIComponent(symbol)}`;

function GroupCard({ g, index }: { g: (typeof GROUPS)[number]; index: number }) {
    const { user } = useAuth();
    const { openLogin } = useLoginModal();
    const t = TONE[g.sector];

    // Compact on phones (2 per row), roomier on laptops (4 per row)
    const cls = `ai-line group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-3.5 text-left transition duration-300 hover:-translate-y-1 lg:gap-5 lg:p-5 ${t.glow}`;
    const style = { animationDelay: `${index * 50}ms` };

    const body = (
        <>
            <div className="flex items-start justify-between">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br font-heading text-sm font-semibold ring-1 transition duration-300 group-hover:scale-105 group-hover:-rotate-3 lg:h-14 lg:w-14 lg:rounded-2xl lg:text-base ${t.tile}`}
                >
                    {g.symbol.slice(0, 2)}
                </div>
                <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-line text-ink-soft opacity-0 transition duration-300 group-hover:opacity-100 lg:flex">
                    <ArrowUpRight size={15} />
                </span>
            </div>

            <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-ink lg:text-base">{g.symbol}</p>
                <p className="truncate text-xs text-ink-soft lg:text-sm">{g.name}</p>
            </div>

            <div className="mt-auto flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium lg:px-2.5 lg:text-[11px] ${t.pill}`}>
                    {g.sector}
                </span>
                <span className="hidden text-xs font-medium text-ink-soft opacity-0 transition duration-300 group-hover:opacity-100 lg:block">
                    Open discussion
                </span>
            </div>
        </>
    );

    if (user) {
        return (
            <Link
                href={user.role === "USER" ? chatPath(g.symbol) : HOME_BY_ROLE[user.role]}
                className={cls}
                style={style}
            >
                {body}
            </Link>
        );
    }
    return (
        <button type="button" onClick={() => openLogin(chatPath(g.symbol))} className={cls} style={style}>
            {body}
        </button>
    );
}

export default function PopularGroups() {
    const { user } = useAuth();
    const { openLogin } = useLoginModal();
    const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

    const shown = filter === "All" ? GROUPS : GROUPS.filter((g) => g.sector === filter);

    return (
        <section id="groups" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6 lg:py-14">
            <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                    <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink">Popular groups</h2>
                    <p className="mt-1 text-sm text-ink-soft">Pick a company you follow and join the conversation.</p>
                </div>

                {user ? (
                    <Link
                        href={user.role === "USER" ? "/user/discover" : HOME_BY_ROLE[user.role]}
                        className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline sm:inline-flex"
                    >
                        View all groups <ArrowRight size={15} />
                    </Link>
                ) : (
                    <button
                        onClick={() => openLogin("/user/discover")}
                        className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline sm:inline-flex"
                    >
                        View all groups <ArrowRight size={15} />
                    </button>
                )}
            </div>

            {/* Sector filter: scrolls sideways on small phones instead of wrapping */}
            <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${filter === f
                                ? "border-ink bg-ink text-white"
                                : "border-line bg-surface text-ink-soft hover:border-brand/40 hover:text-ink"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* key restarts the entrance animation whenever the filter changes */}
            <div key={filter} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {shown.map((g, i) => (
                    <GroupCard key={g.symbol} g={g} index={i} />
                ))}
            </div>

            {/* On phones the header link is hidden, so it sits here instead */}
            <div className="mt-5 sm:hidden">
                {user ? (
                    <Link
                        href={user.role === "USER" ? "/user/discover" : HOME_BY_ROLE[user.role]}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand"
                    >
                        View all groups <ArrowRight size={15} />
                    </Link>
                ) : (
                    <button
                        onClick={() => openLogin("/user/discover")}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand"
                    >
                        View all groups <ArrowRight size={15} />
                    </button>
                )}
            </div>
        </section>
    );
}