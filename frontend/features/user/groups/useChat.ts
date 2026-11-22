"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";

export type ChatFile = {
    name: string;
    type: string;
    size: number;
    isImage: boolean;
    url: string;
    downloadUrl: string;
};

export type ChatMessage = {
    id: string;
    body: string;
    createdAt: string;
    sender: { id: string; name: string; isExpert?: boolean };
    file: ChatFile | null;
};

export type Channel = "community" | "premium";
type Ack = { ok: boolean; message?: string };

function merge(a: ChatMessage[], b: ChatMessage[]) {
    const map = new Map<string, ChatMessage>();
    for (const m of [...a, ...b]) map.set(m.id, m);
    return [...map.values()].sort((x, y) => x.createdAt.localeCompare(y.createdAt));
}

export function useChat(symbol: string, channel: Channel = "community") {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [online, setOnline] = useState(false);
    const [error, setError] = useState("");
    const socketRef = useRef<Socket | null>(null);
    const firstLoad = useRef(true);

    const base = `/stocks/${encodeURIComponent(symbol)}`;

    const fetchLatest = useCallback(async () => {
        const res = await api(`${base}/messages?channel=${channel}`);
        if (res.ok) {
            setMessages((cur) => merge(cur, res.data.messages));
            if (firstLoad.current) {
                setHasMore(res.data.hasMore);
                firstLoad.current = false;
            }
        } else {
            setError(res.data?.message ?? "Could not load the messages");
        }
    }, [base, channel]);

    useEffect(() => {
        fetchLatest().finally(() => setLoading(false));
    }, [fetchLatest]);

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("group:join", { symbol, channel }, (ack: Ack) => {
                if (ack?.ok) {
                    setOnline(true);
                    setError("");
                    fetchLatest();
                } else {
                    setError(ack?.message ?? "Could not join the chat");
                }
            });
        });
        socket.on("disconnect", () => setOnline(false));
        socket.on("connect_error", () => setOnline(false));
        socket.on(
            "message:new",
            (m: ChatMessage & { symbol?: string; channel?: string }) => {
                if (m.symbol && m.symbol !== symbol.toUpperCase()) return;
                if ((m.channel ?? "community") !== channel) return;
                setMessages((cur) => merge(cur, [m]));
            }
        );

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [symbol, channel, fetchLatest]);

    const send = useCallback(
        (body: string) =>
            new Promise<string | null>((resolve) => {
                const s = socketRef.current;
                if (!s || !s.connected) return resolve("Not connected yet. Please wait a moment.");
                s.emit("message:send", { symbol, channel, body }, (ack: Ack) =>
                    resolve(ack?.ok ? null : (ack?.message ?? "Could not send"))
                );
            }),
        [symbol, channel]
    );

    const sendFile = useCallback(
        async (file: File, caption: string) => {
            const fd = new FormData();
            fd.append("file", file);
            if (caption) fd.append("caption", caption);
            const res = await api(`${base}/attachments?channel=${channel}`, {
                method: "POST",
                body: fd,
            });
            if (res.ok) {
                setMessages((cur) => merge(cur, [res.data.message]));
                return null;
            }
            return (res.data?.message as string) ?? "Could not upload the file";
        },
        [base, channel]
    );

    const loadOlder = useCallback(async () => {
        const before = messages[0]?.createdAt;
        if (!before) return;
        const res = await api(
            `${base}/messages?channel=${channel}&before=${encodeURIComponent(before)}`
        );
        if (res.ok) {
            setMessages((cur) => merge(res.data.messages, cur));
            setHasMore(res.data.hasMore);
        }
    }, [base, channel, messages]);

    return { messages, hasMore, loading, online, error, send, sendFile, loadOlder };
}