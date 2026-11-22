"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { userNav } from "../nav";

const STORAGE_KEY = "sp-sidebar-collapsed";

function isActive(pathname: string, href: string) {
    return href === "/user" ? pathname === "/user" : pathname.startsWith(href);
}

export default function UserShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const inChat = /^\/user\/chats\/[^/]+/.test(pathname);
    const fullBleed = pathname.startsWith("/user/chats");
    const router = useRouter();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    // Remember the choice (read after mount, so server and browser HTML match)
    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
        } catch { }
    }, []);

    function toggle() {
        setCollapsed((c) => {
            try {
                localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
            } catch { }
            return !c;
        });
    }

    async function handleLogout() {
        await logout();
        router.replace("/login");
    }

    const initial = user?.name?.charAt(0).toUpperCase() ?? "U";

    return (
        <div className="min-h-screen bg-paper font-sans text-ink">
            {/* Desktop sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-300 lg:flex ${collapsed ? "w-[72px]" : "w-60"
                    }`}
            >
                <button
                    onClick={toggle}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="absolute top-7 -right-3 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-sm transition hover:text-brand"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <Link
                    href="/"
                    className={`flex h-[72px] items-center ${collapsed ? "justify-center" : "px-6"}`}
                >
                    {collapsed ? (
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-heading text-lg font-bold text-white">
                            S
                        </span>
                    ) : (
                        <span className="font-heading text-xl font-bold tracking-tight text-ink">
                            Stock<span className="text-brand">Peer</span>
                        </span>
                    )}
                </Link>

                <nav className="flex-1 space-y-0.5 px-3 pt-2">
                    {userNav.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(pathname, item.href);
                        const row = `group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition ${collapsed ? "justify-center px-0" : "gap-3 px-3"
                            }`;
                        const tip = collapsed && (
                            <span className="pointer-events-none absolute left-full ml-3 rounded-md bg-ink px-2.5 py-1 text-xs whitespace-nowrap text-paper opacity-0 shadow transition group-hover:opacity-100">
                                {item.label}
                                {!item.ready && " (soon)"}
                            </span>
                        );

                        if (!item.ready) {
                            return (
                                <div
                                    key={item.href}
                                    className={`${row} cursor-not-allowed text-ink-soft/60`}
                                >
                                    <Icon size={18} strokeWidth={1.75} />
                                    {!collapsed && (
                                        <>
                                            {item.label}
                                            <span className="ml-auto rounded-full bg-line px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                                                Soon
                                            </span>
                                        </>
                                    )}
                                    {tip}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${row} ${active
                                    ? "bg-brand/[0.07] text-brand"
                                    : "text-ink-soft hover:bg-line/50 hover:text-ink"
                                    }`}
                            >
                                {active && (
                                    <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
                                )}
                                <Icon size={18} strokeWidth={active ? 2 : 1.75} />
                                {!collapsed && item.label}
                                {tip}
                            </Link>
                        );
                    })}
                </nav>

                <div className="space-y-1 border-t border-line p-3">
                    <div
                        className={`flex items-center ${collapsed ? "justify-center py-1" : "gap-3 px-2 py-1.5"}`}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                            {initial}
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-ink">
                                    {user?.name}
                                </p>
                                <p className="truncate text-xs text-ink-soft">{user?.email}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Log out"
                        className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-ink-soft transition hover:bg-down/10 hover:text-down ${collapsed ? "justify-center" : "gap-3 px-3"
                            }`}
                    >
                        <LogOut size={17} strokeWidth={1.75} />
                        {!collapsed && "Log out"}
                    </button>
                </div>
            </aside>

            {/* Mobile top bar */}
            <header
                className={`${inChat ? "hidden" : "flex"} sticky top-0 z-40 items-center justify-between border-b border-line bg-paper/85 px-5 py-3 backdrop-blur lg:hidden`}
            >
                <Link href="/" className="font-heading text-lg font-bold tracking-tight text-ink">
                    Stock<span className="text-brand">Peer</span>
                </Link>
                <button
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:text-down"
                >
                    Log out
                </button>
            </header>

            {/* Page content */}
            <main
                className={`transition-[padding] duration-300 ${collapsed ? "lg:pl-[72px]" : "lg:pl-60"
                    } ${fullBleed ? "" : "px-5 py-8 pb-28 lg:pb-12"}`}
            >
                {fullBleed ? (
                    children
                ) : (
                    <div className="mx-auto max-w-6xl lg:px-8">{children}</div>
                )}
            </main>

            {/* Mobile bottom tabs */}
            <nav
                className={`${inChat ? "hidden" : "flex"} fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface lg:hidden`}
            >
                {userNav.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    const base = "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]";

                    if (!item.ready) {
                        return (
                            <div key={item.href} className={`${base} text-ink-soft/50`}>
                                <Icon size={20} />
                                {item.label}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${base} font-medium ${active ? "text-brand" : "text-ink-soft"}`}
                        >
                            <Icon size={20} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}