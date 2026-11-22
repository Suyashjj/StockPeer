"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Role } from "@/lib/constants";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: Role;
    verificationStatus?: string;
};

type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    setUser: (user: AuthUser | null) => void;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        api("/auth/me").then((res) => {
            if (cancelled) return;
            setUser(res.ok ? res.data.user : null);
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const logout = useCallback(async () => {
        await api("/auth/logout", { method: "POST" });
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}