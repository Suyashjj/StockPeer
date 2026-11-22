"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BadgeCheck, Check, Crown, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import PageTitle from "@/features/user/components/PageTitle";
import { loadRazorpay } from "@/features/user/premium/useRazorpay";

type Plan = {
    id: string;
    tier: "PREMIUM" | "ELITE";
    months: number;
    pricePaise: number;
    groupLimit: number;
    sessionLimit: number;
};
type Sub = {
    tier: string;
    months: number;
    endsAt: string;
    groupLimit: number;
    groupsUsed: number;
    sessionsTotal: number;
    sessionsUsed: number;
};
type CardId = "FREE" | "PREMIUM" | "ELITE";

const MONTHS = [3, 6, 12];
const MAX_TILT = 10; // total degrees, so about 5 each way
const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

const FREE = [
    "Unlimited free stock communities",
    "Join discussions and chat",
    "Stock news and shared files",
];
const FREE_NO = ["No expert access", "No counselling"];

function benefits(tier: "PREMIUM" | "ELITE", p?: Plan) {
    const base = [
        `Join ${p?.groupLimit ?? (tier === "ELITE" ? 20 : 10)} premium stock communities`,
        "Expert assigned to each community",
        "Ask questions and receive expert guidance",
        "Participate in expert-led discussions",
        "Access educational webinars",
    ];
    if (tier === "PREMIUM") return base;
    return [
        base[0],
        "Expert access in communities",
        "Priority questions and responses",
        `${p?.sessionLimit ?? 2} personal counselling sessions`,
        "Access to exclusive expert webinars",
        "Priority support",
    ];
}

function Tick({ active, i }: { active: boolean; i: number }) {
    return (
        <Check
            size={16}
            style={{ transitionDelay: active ? `${i * 40}ms` : "0ms" }}
            className={`mt-0.5 shrink-0 text-up transition duration-300 motion-reduce:transition-none ${active ? "scale-125" : "scale-100"
                }`}
        />
    );
}

/**
 * 3D tilt on hover. The outer div listens to the mouse (it never moves, so there
 * is no edge flicker); the inner div is the one that rotates. A soft light
 * follows the cursor across the card.
 */
function Tilt({ children }: { children: React.ReactNode }) {
    const inner = useRef<HTMLDivElement>(null);

    function move(e: React.PointerEvent<HTMLDivElement>) {
        if (e.pointerType !== "mouse") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const el = inner.current;
        if (!el) return;
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transition = "transform 120ms ease-out";
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * MAX_TILT}deg) rotateY(${(px - 0.5) * MAX_TILT}deg) scale3d(1.02, 1.02, 1.02)`;
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
    }

    function leave() {
        const el = inner.current;
        if (!el) return;
        el.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
    }

    return (
        <div className="h-full" onPointerMove={move} onPointerLeave={leave}>
            <div ref={inner} className="group relative h-full will-change-transform">
                {children}
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                        background:
                            "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.55), transparent 60%)",
                    }}
                />
            </div>
        </div>
    );
}

export default function PremiumPage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [sub, setSub] = useState<Sub | null>(null);
    const [months, setMonths] = useState(6);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [loading, setLoading] = useState(true);

    // Blue outline: Premium by default, moves only when a card is clicked
    const [selected, setSelected] = useState<CardId>("PREMIUM");
    const boxRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<Partial<Record<CardId, HTMLDivElement | null>>>({});
    const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [ready, setReady] = useState(false);

    const load = useCallback(async () => {
        const res = await api("/billing/plans");
        if (res.ok) {
            setPlans(res.data.plans);
            setSub(res.data.subscription);
        } else {
            setMsg({ ok: false, text: res.data?.message ?? "Could not load plans" });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const measure = useCallback(() => {
        const el = cardRefs.current[selected];
        if (!el) return;
        setRect({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    }, [selected]);

    useLayoutEffect(() => {
        measure();
    }, [measure, loading, plans.length, months]);

    // Turn transitions on only after the first placement, so it doesn't fly in from 0,0
    useEffect(() => {
        if (rect && !ready) {
            const id = requestAnimationFrame(() => setReady(true));
            return () => cancelAnimationFrame(id);
        }
    }, [rect, ready]);

    // Keep the outline correct when the window is resized
    useEffect(() => {
        const box = boxRef.current;
        if (!box) return;
        const ro = new ResizeObserver(() => measure());
        ro.observe(box);
        return () => ro.disconnect();
    }, [measure, loading]);

    async function buy(plan: Plan) {
        setBusy(true);
        setMsg(null);

        if (!(await loadRazorpay())) {
            setMsg({ ok: false, text: "Could not load the payment window. Check your internet." });
            setBusy(false);
            return;
        }

        const res = await api("/billing/checkout", { method: "POST", body: { planId: plan.id } });
        if (!res.ok) {
            setMsg({ ok: false, text: res.data?.message ?? "Could not start the payment" });
            setBusy(false);
            return;
        }

        const rzp = new window.Razorpay!({
            key: res.data.keyId,
            amount: res.data.amount,
            currency: "INR",
            order_id: res.data.orderId,
            name: "StockPeer",
            description: `${plan.tier === "ELITE" ? "Elite" : "Premium"} · ${plan.months} months`,
            prefill: { name: user?.name, email: user?.email },
            theme: { color: "#2f5fd0" },
            handler: async (r: {
                razorpay_order_id: string;
                razorpay_payment_id: string;
                razorpay_signature: string;
            }) => {
                const v = await api("/billing/verify", { method: "POST", body: r });
                if (v.ok) {
                    setSub(v.data.subscription);
                    setMsg({ ok: true, text: "Payment successful. Your plan is active." });
                } else {
                    setMsg({
                        ok: false,
                        text: "Payment received, but we could not confirm it yet. It will activate shortly. If not, contact support.",
                    });
                }
                setBusy(false);
            },
            modal: { ondismiss: () => setBusy(false) },
        });
        rzp.on("payment.failed", () => {
            setMsg({ ok: false, text: "Payment failed. You were not charged. Please try again." });
            setBusy(false);
        });
        rzp.open();
    }

    const byTier = (t: "PREMIUM" | "ELITE") => plans.find((p) => p.tier === t && p.months === months);

    const cardProps = (id: CardId, index: number) => ({
        ref: (el: HTMLDivElement | null) => {
            cardRefs.current[id] = el;
        },
        onClick: () => setSelected(id),
        style: { animationDelay: `${index * 80}ms` },
        className: "ai-line h-full cursor-pointer",
    });

    const monthIndex = Math.max(0, MONTHS.indexOf(months));

    return (
        <div className="space-y-8">
            <PageTitle title="Plans" subtitle="Unlock expert-led groups and personal guidance." />

            {msg && (
                <p
                    className={`rounded-xl border p-4 text-sm ${msg.ok ? "border-up/30 bg-up/5 text-up" : "border-down/30 bg-down/5 text-down"
                        }`}
                >
                    {msg.text}
                </p>
            )}

            {sub && (
                <div className="ai-line flex flex-col gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-surface to-surface p-5 sm:flex-row sm:items-center">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <Crown size={22} />
                    </div>
                    <div className="flex-1">
                        <p className="font-heading font-semibold text-ink">
                            {sub.tier === "ELITE" ? "Elite" : "Premium"} plan · {sub.months} months
                        </p>
                        <p className="text-sm text-ink-soft">
                            Active until{" "}
                            {new Date(sub.endsAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })}{" "}
                            · {sub.groupsUsed}/{sub.groupLimit} premium groups
                            {sub.sessionsTotal > 0 &&
                                ` · ${sub.sessionsTotal - sub.sessionsUsed} counselling sessions left`}
                        </p>
                    </div>
                </div>
            )}

            {/* Billing period toggle with a sliding pill */}
            <div className="relative inline-grid grid-cols-3 rounded-full border border-line bg-white p-1">
                <span
                    aria-hidden
                    className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-brand shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
                    style={{ transform: `translateX(${monthIndex * 100}%)` }}
                />
                {MONTHS.map((m) => (
                    <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`relative z-10 rounded-full px-5 py-2 text-center text-sm font-medium transition-colors duration-300 ${months === m ? "text-white" : "text-ink-soft hover:text-ink"
                            }`}
                    >
                        {m} months
                    </button>
                ))}
            </div>

            {loading && <p className="text-ink-soft">Loading plans...</p>}

            {!loading && (
                <div ref={boxRef} className="relative grid gap-5 lg:grid-cols-3">
                    {/* The one blue outline. It slides to a card only when that card is clicked */}
                    {rect && (
                        <span
                            aria-hidden
                            className={`pointer-events-none absolute top-0 left-0 z-10 rounded-2xl border-2 border-brand shadow-[0_10px_34px_rgba(47,95,208,0.16)] motion-reduce:transition-none ${ready
                                    ? "transition-[transform,width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                    : ""
                                }`}
                            style={{
                                width: rect.w,
                                height: rect.h,
                                transform: `translate(${rect.x}px, ${rect.y}px)`,
                            }}
                        />
                    )}

                    {/* Free */}
                    <div {...cardProps("FREE", 0)}>
                        <Tilt>
                            <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
                                <p className="font-heading text-lg font-semibold text-ink">Free</p>
                                <p className="mt-3 font-heading text-4xl font-semibold tracking-tight text-ink">₹0</p>
                                <p className="text-sm text-ink-soft">Always free</p>
                                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                                    {FREE.map((f, i) => (
                                        <li key={f} className="flex gap-2 text-ink">
                                            <Tick active={selected === "FREE"} i={i} /> {f}
                                        </li>
                                    ))}
                                    {FREE_NO.map((f) => (
                                        <li key={f} className="flex gap-2 text-ink-soft/70">
                                            <span className="mt-0.5 w-4 shrink-0 text-center">–</span> {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 rounded-lg border border-line py-2.5 text-center text-sm font-medium text-ink-soft">
                                    {sub ? "Included" : "Your current plan"}
                                </div>
                            </div>
                        </Tilt>
                    </div>

                    {(["PREMIUM", "ELITE"] as const).map((tier, idx) => {
                        const p = byTier(tier);
                        const isCurrent = sub?.tier === tier;
                        return (
                            <div key={tier} {...cardProps(tier, idx + 1)}>
                                <Tilt>
                                    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
                                        <div className="flex items-center justify-between">
                                            <p className="font-heading text-lg font-semibold text-ink">
                                                {tier === "ELITE" ? "Elite" : "Premium"}
                                            </p>
                                            {tier === "PREMIUM" && (
                                                <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                                                    <Sparkles size={12} /> Most popular
                                                </span>
                                            )}
                                        </div>

                                        {/* key restarts the fade whenever the billing period changes */}
                                        <div key={months} className="ai-line">
                                            <p className="mt-3 font-heading text-4xl font-semibold tracking-tight text-ink tabular-nums">
                                                {p ? rupees(p.pricePaise) : "-"}
                                            </p>
                                            <p className="text-sm text-ink-soft">
                                                {p
                                                    ? `for ${p.months} months · about ${rupees(
                                                        Math.round(p.pricePaise / p.months),
                                                    )}/month`
                                                    : ""}
                                            </p>
                                        </div>

                                        <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                                            {benefits(tier, p).map((f, i) => (
                                                <li key={f} className="flex gap-2 text-ink">
                                                    <Tick active={selected === tier} i={i} /> {f}
                                                </li>
                                            ))}
                                        </ul>

                                        {isCurrent ? (
                                            <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand/5 py-2.5 text-sm font-semibold text-brand">
                                                <BadgeCheck size={16} /> Your current plan
                                            </div>
                                        ) : sub ? (
                                            <div className="mt-6 rounded-lg border border-line py-2.5 text-center text-sm font-medium text-ink-soft">
                                                You have an active plan
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (p) buy(p);
                                                }}
                                                disabled={!p || busy}
                                                className="mt-6 rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                                            >
                                                {busy ? "Please wait..." : "Get " + (tier === "ELITE" ? "Elite" : "Premium")}
                                            </button>
                                        )}
                                    </div>
                                </Tilt>
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-xs text-ink-soft">
                Prices include GST. Experts share education and views, not personalised investment
                advice.
            </p>
        </div>
    );
}