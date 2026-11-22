"use client";

import { useParams } from "next/navigation";
import ChatList from "@/features/user/chats/ChatList";

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
    const params = useParams<{ symbol?: string }>();
    const symbol = params.symbol ? decodeURIComponent(params.symbol) : undefined;
    const open = !!symbol;

    return (
        <div className={`flex ${open ? "h-[100dvh]" : "h-[calc(100dvh-120px)]"} lg:h-screen`}>
            <aside
                className={`${open ? "hidden" : "flex"} w-full flex-col border-r border-line bg-surface lg:flex lg:w-80 lg:shrink-0 xl:w-96`}
            >
                <ChatList activeSymbol={symbol} />
            </aside>
            <section className={`${open ? "flex" : "hidden"} min-w-0 flex-1 flex-col lg:flex`}>
                {children}
            </section>
        </div>
    );
}