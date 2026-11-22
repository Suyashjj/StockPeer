"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Compass, Search, SearchX, X } from "lucide-react";
import { useChatList } from "./useChatList";

function when(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    }
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" });
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wraps every matched word in a soft highlight. */
function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
    if (tokens.length === 0) return <>{text}</>;
    const re = new RegExp(`(${tokens.map(escapeRe).join("|")})`, "gi");
    // With one capture group, odd indexes are the matches
    return (
        <>
            {text.split(re).map((part, i) =>
                i % 2 === 1 ? (
                    <mark key={i} className="rounded bg-amber-200/70 px-0.5 text-inherit">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                ),
            )}
        </>
    );
}

export default function ChatList({ activeSymbol }: { activeSymbol?: string }) {
    const { items, error } = useChatList(activeSymbol);
    const [q, setQ] = useState("");
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Ctrl+K / Cmd+K focuses the search box
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Longest words first, so overlapping matches highlight cleanly
    const tokens = Array.from(new Set(q.trim().toLowerCase().split(/\s+/).filter(Boolean))).sort(
        (a, b) => b.length - a.length,
    );

    const preview = (s: NonNullable<typeof items>[number]) =>
        s.lastMessage ? `${s.lastMessage.mine ? "You" : s.lastMessage.senderName}: ${s.lastMessage.body}` : s.name;

    // Every word must appear somewhere in: symbol, company name, or last message
    const shown = (items ?? []).filter((s) => {
        if (tokens.length === 0) return true;
        const hay = `${s.symbol} ${s.name} ${s.lastMessage ? preview(s) : ""}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
    });

    function clear() {
        setQ("");
        inputRef.current?.focus();
    }

    return (
        <>
            <div className="space-y-3 border-b border-line px-4 pt-5 pb-4">
                <div className="flex items-baseline justify-between">
                    <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">Chats</h1>
                    {items && tokens.length > 0 && (
                        <span className="text-xs text-ink-soft tabular-nums">
                            {shown.length} {shown.length === 1 ? "result" : "results"}
                        </span>
                    )}
                </div>

                <div className="relative">
                    <Search
                        size={15}
                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft"
                    />
                    <input
                        ref={inputRef}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                if (q) setQ("");
                                else e.currentTarget.blur();
                            }
                        }}
                        placeholder="Search name, symbol or message"
                        aria-label="Search your chats"
                        className="w-full rounded-full border border-line bg-white py-2 pr-16 pl-9 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                    {q ? (
                        <button
                            onClick={clear}
                            aria-label="Clear search"
                            className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition hover:bg-line hover:text-ink"
                        >
                            <X size={14} />
                        </button>
                    ) : (
                        !focused && (
                            <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-[10px] font-medium text-ink-soft sm:block">
                                Ctrl K
                            </kbd>
                        )
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {error && <p className="p-4 text-sm text-down">{error}</p>}
                {!items && !error && <p className="p-4 text-sm text-ink-soft">Loading...</p>}

                {items && items.length === 0 && (
                    <div className="flex flex-col items-center px-6 py-14 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                            <Compass size={22} />
                        </div>
                        <p className="mt-4 font-medium text-ink">No chats yet</p>
                        <p className="mt-1 text-sm text-ink-soft">Join a stock group to start discussing.</p>
                        <Link
                            href="/user/discover"
                            className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        >
                            Find a stock
                        </Link>
                    </div>
                )}

                {items && items.length > 0 && shown.length === 0 && (
                    <div className="flex flex-col items-center px-6 py-12 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-line text-ink-soft">
                            <SearchX size={20} />
                        </div>
                        <p className="mt-3 text-sm font-medium text-ink">No chats match “{q.trim()}”</p>
                        <p className="mt-1 text-xs text-ink-soft">Try a symbol, company name or a word from a message.</p>
                        <button onClick={clear} className="mt-3 text-xs font-medium text-brand hover:underline">
                            Clear search
                        </button>
                    </div>
                )}

                {shown.map((s) => {
                    const active = s.symbol === activeSymbol;
                    const unread = s.unread ?? 0;
                    const last = s.lastMessage;
                    return (
                        <Link
                            key={s.id}
                            href={`/user/chats/${encodeURIComponent(s.symbol)}`}
                            className={`relative flex items-center gap-3 px-4 py-3 transition ${active ? "bg-brand/10" : "hover:bg-line/40"
                                }`}
                        >
                            {active && (
                                <span className="absolute top-1/2 left-0 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
                            )}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/[0.16] to-brand/[0.05] font-heading text-sm font-semibold text-brand ring-1 ring-brand/15">
                                {s.symbol.slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="truncate font-semibold text-ink">
                                        <Highlight text={s.symbol} tokens={tokens} />
                                    </p>
                                    {last && (
                                        <span
                                            className={`shrink-0 text-[11px] ${unread ? "font-semibold text-brand" : "text-ink-soft"
                                                }`}
                                        >
                                            {when(last.createdAt)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <p
                                        className={`truncate text-sm ${unread ? "font-medium text-ink" : "text-ink-soft"
                                            }`}
                                    >
                                        <Highlight text={preview(s)} tokens={tokens} />
                                    </p>
                                    {unread > 0 && (
                                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                                            {unread > 99 ? "99+" : unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </>
    );
}