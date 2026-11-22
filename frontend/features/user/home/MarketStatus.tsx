"use client";

import { useEffect, useState } from "react";

const OPEN = 9 * 60 + 15; // 9:15 AM IST
const CLOSE = 15 * 60 + 30; // 3:30 PM IST
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function istParts(d: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return {
        day: DAYS.indexOf(get("weekday")),
        mins: Number(get("hour")) * 60 + Number(get("minute")),
    };
}

function getStatus(d: Date) {
    const { day, mins } = istParts(d);
    const weekday = day >= 1 && day <= 5;

    if (weekday && mins >= OPEN && mins < CLOSE) {
        return { open: true, text: "Market open · closes 3:30 PM" };
    }

    let when = "Mon";
    if (weekday && mins < OPEN) when = "today";
    else if (day >= 1 && day <= 4) when = "tomorrow";

    return { open: false, text: `Market closed · opens ${when} 9:15 AM` };
}

export default function MarketStatus({ dark = false }: { dark?: boolean }) {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);

    if (!now) return <span className="h-6" />;

    const { open, text } = getStatus(now);

    const pill = open
        ? dark
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            : "border-up/20 bg-up/10 text-up"
        : dark
            ? "border-white/15 bg-white/5 text-white/70"
            : "border-line bg-white/70 text-ink-soft";

    const dot = open ? (dark ? "bg-emerald-400" : "bg-up") : dark ? "bg-white/40" : "bg-ink-soft/50";

    return (
        <span
            title="Based on NSE trading hours. Exchange holidays are not included."
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${pill}`}
        >
            <span className="relative flex h-2 w-2">
                {open && (
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping ${dot}`} />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
            </span>
            {text}
        </span>
    );
}