"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useAdminGet<T>(path: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await api(path);
            if (cancelled) return;
            if (res.ok) setData(res.data as T);
            else setError(res.data?.message ?? "Could not load this page");
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [path]);

    return { data, loading, error };
}