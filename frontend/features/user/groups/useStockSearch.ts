"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { StockItem } from "./types";

const LIMIT = 20;

export function useStockSearch(query: string) {
    const [items, setItems] = useState<StockItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const reqId = useRef(0);

    // Waits 300 ms after typing, and ignores answers that arrive late
    useEffect(() => {
        const id = ++reqId.current;
        setLoading(true);
        const timer = setTimeout(async () => {
            const res = await api(`/stocks?q=${encodeURIComponent(query)}&page=1&limit=${LIMIT}`);
            if (id !== reqId.current) return;
            if (res.ok) {
                setItems(res.data.items);
                setTotal(res.data.total);
                setPage(1);
                setError("");
            } else {
                setError(res.data?.message ?? "Could not load stocks");
            }
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const loadMore = useCallback(async () => {
        const id = reqId.current;
        const next = page + 1;
        setLoadingMore(true);
        const res = await api(`/stocks?q=${encodeURIComponent(query)}&page=${next}&limit=${LIMIT}`);
        if (id !== reqId.current) return;
        if (res.ok) {
            setItems((cur) => [...cur, ...res.data.items]);
            setPage(next);
        }
        setLoadingMore(false);
    }, [page, query]);

    const updateItem = useCallback((s: StockItem) => {
        setItems((cur) => cur.map((x) => (x.id === s.id ? s : x)));
    }, []);

    return { items, total, loading, loadingMore, error, loadMore, updateItem };
}