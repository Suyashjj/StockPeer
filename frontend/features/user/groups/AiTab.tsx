"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Send, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

type Source = { n: number; title: string; source: string; url: string; publishedAt: string };
type Result = { text: string; sources: Source[]; stale: boolean; empty: boolean };
type Msg = { role: "user" | "assistant"; text: string; sources?: Source[] };

const SUGGESTIONS = [
    "What are the main news items?",
    "Why did the stock move recently?",
    "Is there any news on results or earnings?",
    "What does this company do?",
];

const safeUrl = (u: string) => /^https?:\/\//i.test(u);

// Turns [1] markers into numbered chips that link to the article,
// and [G] into a "Background" chip for lines from general knowledge
function Cited({ text, sources }: { text: string; sources: Source[] }) {
    return (
        <>
            {text.split(/(\[(?:\d+|G)\])/g).map((part, i) => {
                const m = part.match(/^\[(\d+|G)\]$/);
                if (!m) return <span key={i}>{part}</span>;

                if (m[1] === "G") {
                    return (
                        <span
                            key={i}
                            title="From general knowledge, not from the news. It may be outdated."
                            className="mr-1 inline-block rounded-full bg-line px-1.5 align-middle text-[10px] font-semibold text-ink-soft"
                        >
                            Background
                        </span>
                    );
                }

                const s = sources.find((x) => x.n === Number(m[1]));
                if (!s || !safeUrl(s.url)) return null;
                return (
                    <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${s.source}: ${s.title}`}
                        className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand/10 px-1 align-middle text-[10px] font-semibold text-brand transition hover:bg-brand hover:text-white"
                    >
                        {s.n}
                    </a>
                );
            })}
        </>
    );
}

// Shows "- " lines as real bullets, with a soft staggered fade-in
function Answer({ text, sources }: { text: string; sources: Source[] }) {
    const lines = text
        .replace(/\*\*/g, "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    return (
        <div className="space-y-2">
            {lines.map((l, i) => {
                const bullet = /^[-*•]\s+/.test(l);
                const body = bullet ? l.replace(/^[-*•]\s+/, "") : l;
                return (
                    <div
                        key={i}
                        className="ai-line flex gap-2.5"
                        style={{ animationDelay: `${i * 90}ms` }}
                    >
                        {bullet && <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                        <p className="min-w-0 flex-1 leading-relaxed">
                            <Cited text={body} sources={sources} />
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

function SourceRow({ sources }: { sources: Source[] }) {
    const shown = sources.filter((s) => safeUrl(s.url)).slice(0, 4);
    if (shown.length === 0) return null;
    return (
        <div className="mt-3 flex flex-wrap gap-1.5">
            {shown.map((s) => (
                <a
                    key={s.n}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.title}
                    className="inline-flex max-w-[11rem] items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] text-ink-soft transition hover:border-brand hover:text-brand"
                >
                    <span className="font-semibold text-brand">{s.n}</span>
                    <span className="truncate">{s.source}</span>
                    <ExternalLink size={10} className="shrink-0" />
                </a>
            ))}
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-2.5" aria-label="Reading the latest news">
            {[92, 80, 64].map((w) => (
                <div key={w} className="h-3 animate-pulse rounded-full bg-brand/10" style={{ width: `${w}%` }} />
            ))}
        </div>
    );
}

function Dots() {
    return (
        <div className="flex items-center gap-1 py-1" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/60"
                    style={{ animationDelay: `${i * 140}ms` }}
                />
            ))}
        </div>
    );
}

export default function AiTab({ symbol }: { symbol: string }) {
    const [summary, setSummary] = useState<Result | null>(null);
    const [error, setError] = useState("");
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [q, setQ] = useState("");
    const [asking, setAsking] = useState(false);
    const [askError, setAskError] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await api(`/stocks/${encodeURIComponent(symbol)}/ai/summary`);
            if (cancelled) return;
            if (res.ok) setSummary(res.data);
            else setError(res.data?.message ?? "Could not load the summary");
        })();
        return () => {
            cancelled = true;
        };
    }, [symbol]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [msgs, asking]);

    async function ask(question: string) {
        const text = question.trim();
        if (!text || asking) return;
        setAskError("");
        setAsking(true);
        setQ("");

        const history = msgs.slice(-4).map((m) => ({ role: m.role, text: m.text }));
        setMsgs((cur) => [...cur, { role: "user", text }]);

        const res = await api(`/stocks/${encodeURIComponent(symbol)}/ai/ask`, {
            method: "POST",
            body: { question: text, history },
        });
        if (res.ok) {
            setMsgs((cur) => [...cur, { role: "assistant", text: res.data.text, sources: res.data.sources }]);
        } else {
            setAskError(res.data?.message ?? "Could not get an answer");
        }
        setAsking(false);
    }

    // Questions are allowed even with no news, because background can still be answered
    const canAsk = !!summary || msgs.length > 0;
    const ready = summary && !summary.empty;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {!summary && !error && (
                    <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
                        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand uppercase">
                            <Sparkles size={13} className="animate-pulse" /> Reading the latest news
                        </p>
                        <Skeleton />
                    </div>
                )}
                {error && <p className="text-sm text-down">{error}</p>}

                {summary?.empty && (
                    <p className="rounded-2xl border border-line bg-white p-4 text-center text-sm text-ink-soft">
                        No recent news found for this company. You can still ask what the company does.
                    </p>
                )}

                {ready && (
                    <div className="ai-line rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 to-brand/5 p-4 shadow-sm">
                        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand uppercase">
                            <Sparkles size={13} /> News summary
                        </p>
                        <div className="text-sm text-ink">
                            <Answer text={summary.text} sources={summary.sources} />
                        </div>
                        <SourceRow sources={summary.sources} />
                        <p className="mt-3 text-[11px] text-ink-soft">
                            Based on headlines and short descriptions, up to 12 hours old.
                            {summary.stale && " Showing saved news."}
                        </p>
                    </div>
                )}

                {canAsk && msgs.length === 0 && (
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => ask(s)}
                                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink-soft transition hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {msgs.map((m, i) => (
                    <div
                        key={i}
                        className={`ai-line flex items-start gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {m.role === "assistant" && (
                            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                                <Sparkles size={13} />
                            </span>
                        )}
                        <div
                            className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user"
                                ? "rounded-br-sm bg-[#d9e4fb] text-ink"
                                : "rounded-bl-sm border border-line bg-white text-ink shadow-sm"
                                }`}
                        >
                            {m.role === "assistant" ? (
                                <>
                                    <Answer text={m.text} sources={m.sources ?? []} />
                                    <SourceRow sources={(m.sources ?? []).filter((s) => m.text.includes(`[${s.n}]`))} />
                                    {m.text.includes("[G]") && (
                                        <p className="mt-2 text-[11px] text-ink-soft">
                                            &quot;Background&quot; lines come from general knowledge, not the news, and
                                            may be outdated.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="whitespace-pre-wrap">{m.text}</p>
                            )}
                        </div>
                    </div>
                ))}

                {asking && (
                    <div className="flex items-start gap-2">
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                            <Sparkles size={13} className="animate-pulse" />
                        </span>
                        <div className="rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-2.5 shadow-sm">
                            <Dots />
                        </div>
                    </div>
                )}
                {askError && <p className="text-sm text-down">{askError}</p>}
                <div ref={endRef} />
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    ask(q);
                }}
                className="shrink-0 border-t border-line p-3"
            >
                <div className="flex items-center gap-2">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        maxLength={300}
                        disabled={!canAsk}
                        placeholder={canAsk ? "Ask about this company" : "Loading..."}
                        className="flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand disabled:opacity-60"
                    />
                    <button
                        type="submit"
                        disabled={!canAsk || asking || q.trim().length < 2}
                        aria-label="Ask"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:opacity-90 disabled:opacity-40"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
}