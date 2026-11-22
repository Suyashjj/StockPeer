"use client";

import { Suspense, createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { safeNext } from "@/lib/safeNext";
import LoginModal from "./LoginModal";

type Ctx = { openLogin: (next?: string) => void };

const LoginModalContext = createContext<Ctx>({ openLogin: () => { } });

/** Any landing component can call: const { openLogin } = useLoginModal(); */
export const useLoginModal = () => useContext(LoginModalContext);

/** Opens the popup when the URL has ?login=1 (this is how /login redirects here). */
function AutoOpen({ open }: { open: (next?: string) => void }) {
    const params = useSearchParams();
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const wanted = params.get("login") === "1";
    const next = safeNext(params.get("next")) ?? undefined;

    useEffect(() => {
        if (!wanted || loading) return;
        if (!user) open(next);
        // Clean the URL either way, so a refresh does not reopen it
        router.replace(pathname, { scroll: false });
    }, [wanted, loading, user, next, open, router, pathname]);

    return null;
}

export default function LandingShell({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [next, setNext] = useState<string | undefined>();

    const openLogin = useCallback((n?: string) => {
        setNext(n);
        setOpen(true);
    }, []);

    return (
        <LoginModalContext.Provider value={{ openLogin }}>
            <Suspense fallback={null}>
                <AutoOpen open={openLogin} />
            </Suspense>
            {children}
            <LoginModal open={open} next={next} onClose={() => setOpen(false)} />
        </LoginModalContext.Provider>
    );
}