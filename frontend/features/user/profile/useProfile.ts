"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { ProfileUser } from "./types";

export function useProfile() {
    const { setUser } = useAuth();
    const [data, setData] = useState<ProfileUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Re-reads the profile from the server
    const reload = useCallback(async () => {
        const res = await api("/users/me");
        if (res.ok) {
            setData(res.data.user);
            setError("");
        } else {
            setError(res.data?.message ?? "Could not load your profile");
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    // After saving: update the page, and refresh the logged-in user (so the sidebar name updates)
    const applyUser = useCallback(
        async (user: ProfileUser) => {
            setData(user);
            const me = await api("/auth/me");
            if (me.ok) setUser(me.data.user);
        },
        [setUser]
    );

    return { data, loading, error, reload, applyUser };
}