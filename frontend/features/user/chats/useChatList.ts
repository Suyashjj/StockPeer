"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { StockItem } from "../groups/types";

type Incoming = {
    symbol: string;
    channel?: string;
    body: string;
    createdAt: string;
    sender: { id: string; name: string };
    file?: { name: string; isImage: boolean } | null;
};

export function useChatList(activeSymbol?: string) {
    const { user } = useAuth();
    const [items, setItems] = useState<StockItem[] | null>(null);
    const [error, setError] = useState("");
    const activeRef = useRef(activeSymbol);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        activeRef.current = activeSymbol;
    }, [activeSymbol]);

    const load = useCallback(async () => {
        const res = await api("/stocks/mine");
        if (res.ok) {
            const active = activeRef.current;
            setItems(
                (res.data.items as StockItem[]).map((s) =>
                    s.symbol === active ? { ...s, unread: 0 } : s
                )
            );
            setError("");
        } else {
            setError(res.data?.message ?? "Could not load your chats");
        }
    }, []);

    // Reload when you open or close a chat
    useEffect(() => {
        load();
    }, [load, activeSymbol]);

    // Reload after joining or leaving a group
    useEffect(() => {
        function changed() {
            load();
            socketRef.current?.emit("rooms:refresh");
        }
        window.addEventListener("chats:changed", changed);
        return () => window.removeEventListener("chats:changed", changed);
    }, [load]);

    // Live updates: new message moves the chat to the top
    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on("message:new", (m: Incoming) => {
            // This list is for community chats only
            if (m.channel && m.channel !== "community") return;

            setItems((cur) => {
                if (!cur) return cur;
                const i = cur.findIndex((s) => s.symbol === m.symbol);
                if (i < 0) return cur;

                const mine = m.sender.id === user?.id;
                const isActive = activeRef.current === m.symbol;
                const prev = cur[i].unread ?? 0;

                const updated: StockItem = {
                    ...cur[i],
                    lastMessage: {
                        body:
                            m.body ||
                            (m.file ? (m.file.isImage ? "📷 Photo" : `📄 ${m.file.name}`) : ""),
                        createdAt: m.createdAt,
                        senderName: m.sender.name,
                        mine,
                    },
                    unread: isActive ? 0 : mine ? prev : prev + 1,
                };
                return [updated, ...cur.filter((_, j) => j !== i)];
            });
        });
        socket.io.on("reconnect", load);

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user?.id, load]);

    return { items, error };
}