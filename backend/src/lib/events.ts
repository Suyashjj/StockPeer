import type { EventType } from "@prisma/client";
import { prisma } from "./prisma";

// Fire and forget: logging must never slow down or break a request
export function logEvent(userId: string, symbol: string, type: EventType) {
    (async () => {
        const stock = await prisma.stock.findUnique({
            where: { symbol: symbol.toUpperCase() },
            select: { id: true },
        });
        if (!stock) return;

        // Opening the same stock again within 30 minutes counts once
        if (type === "VIEW") {
            const recent = await prisma.interactionEvent.findFirst({
                where: {
                    userId,
                    stockId: stock.id,
                    type,
                    createdAt: { gt: new Date(Date.now() - 30 * 60 * 1000) },
                },
                select: { id: true },
            });
            if (recent) return;
        }
        await prisma.interactionEvent.create({ data: { userId, stockId: stock.id, type } });
    })().catch(() => { });
}