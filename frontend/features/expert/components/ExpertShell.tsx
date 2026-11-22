"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { expertNav } from "../nav";

function isActive(pathname: string, href: string) {
    return href === "/expert" ? pathname === "/expert" : pathname.startsWith(href);
}

export default function ExpertShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const inChat = /^\/expert\/groups\/[^/]+/.test(pathname);
    const router = useRouter();
    const { user, logout } = useAuth();

    async function handleLogout() {
        await logout();
        router.replace("/login");
    }

    const initial = user?.name?.charAt(0).toUpperCase() ?? "E";

    return (
        <div className="min-h-screen bg-paper font-sans text-ink">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
                <div className="px-6 py-6">
                    <Link href="/" className="text-xl font-bold tracking-tight text-ink">
                        Stock<span className="text-brand">Peer</span>
                    </Link>
                    <span className="mt-2 block w-fit rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand uppercase">
                        Expert
                    </span>
                </div>

                <nav className="flex-1 space-y-1 px-3">
                    {expertNav.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(pathname, item.href);

                        if (!item.ready) {
                            return (
                                <div
                                    key={item.href}
                                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-soft/60"
                                >
                                    <Icon size={18} />
                                    {item.label}
                                    <span className="ml-auto rounded-full bg-line px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                                        Soon
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active
                                    ? "bg-brand/10 text-brand"
                                    : "text-ink-soft hover:bg-line/60 hover:text-ink"
                                    }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-line p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                            {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                            <p className="truncate text-xs text-ink-soft">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            aria-label="Log out"
                            className="rounded-lg p-2 text-ink-soft transition hover:bg-line/60 hover:text-down"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile top bar */}
            <header
                className={`${inChat ? "hidden" : "flex"} sticky top-0 z-40 items-center justify-between border-b border-line bg-paper/85 px-5 py-3 backdrop-blur lg:hidden`}
            >
                <Link href="/" className="text-lg font-bold tracking-tight text-ink">
                    Stock<span className="text-brand">Peer</span>
                </Link>
                <button
                    onClick={handleLogout}
                    aria-label="Log out"
                    className="rounded-lg p-2 text-ink-soft transition hover:text-down"
                >
                    <LogOut size={18} />
                </button>
            </header>

            <main className={inChat ? "lg:pl-64" : "px-5 py-8 pb-28 lg:pl-64 lg:pb-10"}>
                {inChat ? children : <div className="mx-auto max-w-5xl lg:px-8">{children}</div>}
            </main>

            {/* Mobile bottom tabs */}
            <nav
                className={`${inChat ? "hidden" : "flex"} fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface lg:hidden`}
            >
                {expertNav.map((item) => {
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