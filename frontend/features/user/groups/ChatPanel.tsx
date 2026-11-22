"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowDown,
    ArrowLeft,
    BadgeCheck,
    FileText,
    Loader2,
    LogOut,
    MoreVertical,
    Newspaper,
    Paperclip,
    RotateCcw,
    Send,
    Users,
    X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useChat, type ChatFile, type ChatMessage } from "./useChat";
import FileCard, { ALLOWED_EXT, MAX_BYTES, formatSize } from "./FileCard";
import Lightbox from "./Lightbox";
import MediaPanel from "./MediaPanel";
import NewsPanel from "./NewsPanel";
import LeaveDialog from "./LeaveDialog";
import type { StockItem } from "./types";

// A message that has left the composer but is not confirmed by the server yet
type Outgoing = {
    body: string;
    file: File | null;
    status: "sending" | "failed";
    error: string;
};

function clock(iso: string) {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ChatPanel({
    stock,
    onLeave,
    channel = "community",
    backHref = "/user/chats",
}: {
    stock: StockItem;
    onLeave: () => Promise<void>;
    channel?: "community" | "premium";
    backHref?: string;
}) {
    const { user } = useAuth();
    const { messages, hasMore, loading, error, send, sendFile, loadOlder } = useChat(stock.symbol, channel);

    const [text, setText] = useState("");
    const [pending, setPending] = useState<File | null>(null);
    const [outgoing, setOutgoing] = useState<Outgoing | null>(null);
    const [sendError, setSendError] = useState("");
    const [menu, setMenu] = useState(false);
    const [panel, setPanel] = useState<"media" | "news" | null>(null);
    const [viewer, setViewer] = useState<ChatFile | null>(null);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [showDown, setShowDown] = useState(false);

    const sending = outgoing?.status === "sending";

    const listRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const stick = useRef(true);
    const prevHeight = useRef<number | null>(null);

    // Preview for a photo you are about to send
    const previewUrl = useMemo(
        () => (pending && pending.type.startsWith("image/") ? URL.createObjectURL(pending) : null),
        [pending]
    );
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Separate preview for the photo that is on its way (the composer one is released on send)
    const outFile = outgoing?.file ?? null;
    const outUrl = useMemo(
        () => (outFile && outFile.type.startsWith("image/") ? URL.createObjectURL(outFile) : null),
        [outFile]
    );
    useEffect(() => {
        return () => {
            if (outUrl) URL.revokeObjectURL(outUrl);
        };
    }, [outUrl]);

    // Marks the chat as read when it opens and whenever a new message arrives
    const lastId = messages[messages.length - 1]?.id;
    useEffect(() => {
        if (!lastId) return;
        const t = setTimeout(() => {
            api(`/stocks/${encodeURIComponent(stock.symbol)}/read?channel=${channel}`, { method: "POST" });
        }, 400);
        return () => clearTimeout(t);
    }, [lastId, stock.symbol, channel]);

    useLayoutEffect(() => {
        const el = listRef.current;
        if (!el) return;
        if (prevHeight.current !== null) {
            el.scrollTop = el.scrollHeight - prevHeight.current;
            prevHeight.current = null;
        } else if (stick.current) {
            el.scrollTop = el.scrollHeight;
        }
    }, [messages, outgoing]);

    function onScroll() {
        const el = listRef.current;
        if (!el) return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        stick.current = nearBottom;
        setShowDown(!nearBottom);
    }

    // Photos change the height when they finish loading
    function onImgLoad() {
        const el = listRef.current;
        if (el && stick.current) el.scrollTop = el.scrollHeight;
    }

    function toBottom() {
        const el = listRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }

    async function showOlder() {
        const el = listRef.current;
        if (el) prevHeight.current = el.scrollHeight;
        await loadOlder();
    }

    function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;

        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ALLOWED_EXT.includes(ext)) {
            setSendError("This file type isn't allowed. Use images, PDF, Word, Excel or text files.");
            return;
        }
        if (f.size > MAX_BYTES) {
            setSendError("File must be under 10 MB");
            return;
        }
        setSendError("");
        setPending(f);
    }

    // Shows the message at once, then waits for the server in the background
    async function deliver(item: { body: string; file: File | null }) {
        stick.current = true;
        setOutgoing({ ...item, status: "sending", error: "" });
        const err = item.file ? await sendFile(item.file, item.body) : await send(item.body);
        if (err) setOutgoing({ ...item, status: "failed", error: err });
        else setOutgoing(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const body = text.trim();
        if ((!body && !pending) || outgoing) return;

        setSendError("");
        const item = { body, file: pending };
        setText("");
        setPending(null);
        void deliver(item);
    }

    function retry() {
        if (outgoing) void deliver({ body: outgoing.body, file: outgoing.file });
    }

    function startsGroup(i: number, m: ChatMessage) {
        const p = messages[i - 1];
        if (!p) return true;
        if (dayLabel(p.createdAt) !== dayLabel(m.createdAt)) return true;
        if (p.sender.id !== m.sender.id) return true;
        return new Date(m.createdAt).getTime() - new Date(p.createdAt).getTime() > 5 * 60 * 1000;
    }

    return (
        <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col bg-surface">
                {/* Header */}
                <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-3">
                    <Link
                        href={backHref}
                        aria-label="Back to chats"
                        className="rounded-full p-2 text-ink-soft transition hover:bg-line/60 hover:text-ink lg:hidden"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/[0.16] to-brand/[0.05] font-heading text-sm font-semibold text-brand ring-1 ring-brand/15">
                        {stock.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate font-heading font-semibold text-ink">
                            {stock.symbol}
                            {channel === "premium" && (
                                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                                    Premium
                                </span>
                            )}
                        </p>
                        <p className="flex items-center gap-1 truncate text-xs text-ink-soft">
                            <Users size={12} />
                            {stock.memberCount} {stock.memberCount === 1 ? "member" : "members"}
                        </p>
                    </div>
                    <button
                        onClick={() => setPanel((p) => (p === "news" ? null : "news"))}
                        aria-label="Stock news"
                        title="Stock news"
                        className={`rounded-full p-2 transition hover:bg-line/60 ${panel === "news" ? "text-brand" : "text-ink-soft hover:text-ink"
                            }`}
                    >
                        <Newspaper size={20} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setMenu((v) => !v)}
                            aria-label="Menu"
                            className="rounded-full p-2 text-ink-soft transition hover:bg-line/60 hover:text-ink"
                        >
                            <MoreVertical size={20} />
                        </button>
                        {menu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                                <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
                                    <button
                                        onClick={() => {
                                            setMenu(false);
                                            setPanel("media");
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-ink transition hover:bg-line/40"
                                    >
                                        <FileText size={16} /> Media & files
                                    </button>
                                    {channel === "community" && (
                                        <button
                                            onClick={() => {
                                                setMenu(false);
                                                setConfirmLeave(true);
                                            }}
                                            className="flex w-full items-center gap-2 border-t border-line px-4 py-3 text-sm text-down transition hover:bg-down/5"
                                        >
                                            <LogOut size={16} /> Leave group
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="relative min-h-0 flex-1 bg-[#efeee7]">
                    <div
                        ref={listRef}
                        onScroll={onScroll}
                        className="h-full overflow-y-auto px-4 py-4 sm:px-8"
                    >
                        {hasMore && (
                            <div className="mb-3 text-center">
                                <button
                                    onClick={showOlder}
                                    className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-brand shadow-sm hover:bg-white"
                                >
                                    Load older messages
                                </button>
                            </div>
                        )}
                        {loading && <p className="text-center text-sm text-ink-soft">Loading...</p>}
                        {error && <p className="text-center text-sm text-down">{error}</p>}
                        {!loading && messages.length === 0 && !outgoing && !error && (
                            <p className="mx-auto mt-10 w-fit rounded-full bg-white/80 px-4 py-1.5 text-sm text-ink-soft">
                                No messages yet. Say hello.
                            </p>
                        )}

                        {messages.map((m, i) => {
                            const mine = m.sender.id === user?.id;
                            const first = startsGroup(i, m);
                            const newDay =
                                i === 0 ||
                                dayLabel(messages[i - 1].createdAt) !== dayLabel(m.createdAt);
                            return (
                                <div key={m.id}>
                                    {newDay && (
                                        <div className="my-3 text-center">
                                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-ink-soft shadow-sm">
                                                {dayLabel(m.createdAt)}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={`flex ${mine ? "justify-end" : "justify-start"} ${first ? "mt-2" : "mt-0.5"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[80%] px-3 py-1.5 shadow-sm sm:max-w-[65%] ${mine ? "bg-[#d9e4fb] text-ink" : "bg-white text-ink"
                                                } ${first
                                                    ? mine
                                                        ? "rounded-2xl rounded-tr-sm"
                                                        : "rounded-2xl rounded-tl-sm"
                                                    : "rounded-2xl"
                                                }`}
                                        >
                                            {!mine && first && (
                                                <p className="flex items-center gap-1 text-xs font-semibold text-brand">
                                                    {m.sender.name}
                                                    {m.sender.isExpert && (
                                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-up/10 px-1.5 py-0.5 text-[10px] text-up">
                                                            <BadgeCheck size={10} /> Expert
                                                        </span>
                                                    )}
                                                </p>
                                            )}

                                            {m.file && m.file.isImage && (
                                                <button
                                                    onClick={() => setViewer(m.file)}
                                                    className="mt-1 mb-1 block overflow-hidden rounded-lg"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={m.file.url}
                                                        alt={m.file.name}
                                                        onLoad={onImgLoad}
                                                        className="max-h-72 w-64 object-cover sm:w-72"
                                                    />
                                                </button>
                                            )}
                                            {m.file && !m.file.isImage && (
                                                <div className="mt-1 mb-1 w-64 sm:w-72">
                                                    <FileCard file={m.file} />
                                                </div>
                                            )}

                                            {m.body ? (
                                                <p className="text-sm break-words whitespace-pre-wrap">
                                                    {m.body}
                                                    <span className="float-right mt-1.5 ml-3 text-[10px] text-ink-soft">
                                                        {clock(m.createdAt)}
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="text-right text-[10px] text-ink-soft">
                                                    {clock(m.createdAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Message on its way: shows instantly, confirmed or failed below */}
                        {outgoing && (
                            <div className="ai-line mt-2 flex flex-col items-end">
                                <div
                                    className={`max-w-[80%] rounded-2xl px-3 py-1.5 shadow-sm transition sm:max-w-[65%] ${outgoing.status === "failed"
                                            ? "border border-down/40 bg-down/5 text-ink"
                                            : "bg-[#d9e4fb] text-ink opacity-75"
                                        }`}
                                >
                                    {outgoing.file &&
                                        (outUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={outUrl}
                                                alt=""
                                                onLoad={onImgLoad}
                                                className="mt-1 mb-1 max-h-72 w-64 rounded-lg object-cover sm:w-72"
                                            />
                                        ) : (
                                            <div className="mt-1 mb-1 flex w-64 items-center gap-2.5 rounded-lg bg-white/70 p-2.5 sm:w-72">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                                    <FileText size={18} />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-medium text-ink">
                                                        {outgoing.file.name}
                                                    </span>
                                                    <span className="block text-xs text-ink-soft">
                                                        {formatSize(outgoing.file.size)}
                                                    </span>
                                                </span>
                                            </div>
                                        ))}

                                    <p className="text-sm break-words whitespace-pre-wrap">
                                        {outgoing.body}
                                        <span className="float-right mt-1.5 ml-3 inline-flex items-center gap-1 text-[10px] text-ink-soft">
                                            {outgoing.status === "sending" ? (
                                                <>
                                                    <Loader2 size={11} className="animate-spin" />
                                                    {outgoing.file ? "Uploading" : "Sending"}
                                                </>
                                            ) : (
                                                <AlertCircle size={11} className="text-down" />
                                            )}
                                        </span>
                                    </p>
                                </div>

                                {outgoing.status === "failed" && (
                                    <div className="mt-1 flex items-center gap-3 text-xs">
                                        <span className="text-down">{outgoing.error || "Failed to send"}</span>
                                        <button
                                            onClick={retry}
                                            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                                        >
                                            <RotateCcw size={12} /> Retry
                                        </button>
                                        <button
                                            onClick={() => setOutgoing(null)}
                                            className="font-medium text-ink-soft hover:text-ink hover:underline"
                                        >
                                            Discard
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {showDown && (
                        <button
                            onClick={toBottom}
                            aria-label="Scroll to latest"
                            className="absolute right-5 bottom-4 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-md transition hover:text-brand"
                        >
                            <ArrowDown size={18} />
                        </button>
                    )}
                </div>

                {/* Composer */}
                <form
                    onSubmit={handleSubmit}
                    className="shrink-0 border-t border-line bg-surface px-3 py-3 sm:px-6"
                >
                    {pending && (
                        <div className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-white p-2.5">
                            {previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={previewUrl}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                    <FileText size={24} />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink">{pending.name}</p>
                                <p className="text-xs text-ink-soft">{formatSize(pending.size)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPending(null)}
                                aria-label="Remove file"
                                className="rounded-full p-2 text-ink-soft transition hover:bg-line/60 hover:text-ink"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {sendError && <p className="mb-2 px-2 text-xs text-down">{sendError}</p>}

                    <div className="flex items-center gap-2">
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={pickFile}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={!!outgoing}
                            aria-label="Attach a file"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-line/60 hover:text-brand disabled:opacity-40"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            maxLength={1000}
                            placeholder={pending ? "Add a caption" : "Type a message"}
                            className="flex-1 rounded-full border border-line bg-white px-5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-brand"
                        />
                        <button
                            type="submit"
                            disabled={!!outgoing || (!text.trim() && !pending)}
                            aria-label={sending ? "Sending" : "Send"}
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:opacity-90 disabled:hover:opacity-100 ${sending ? "opacity-80" : "disabled:opacity-40"
                                }`}
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </form>
            </div>

            {panel === "media" && (
                <MediaPanel
                    symbol={stock.symbol}
                    channel={channel}
                    onClose={() => setPanel(null)}
                    onOpenImage={setViewer}
                />
            )}
            {panel === "news" && (
                <NewsPanel symbol={stock.symbol} onClose={() => setPanel(null)} />
            )}
            {viewer && <Lightbox file={viewer} onClose={() => setViewer(null)} />}
            {confirmLeave && (
                <LeaveDialog
                    symbol={stock.symbol}
                    onConfirm={onLeave}
                    onClose={() => setConfirmLeave(false)}
                />
            )}
        </div>
    );
}