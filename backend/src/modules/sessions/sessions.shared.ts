import { prisma } from "../../lib/prisma";

const DAY = 24 * 60 * 60 * 1000;

// Cancels a session and returns the credit when the rules allow it
export async function cancelSession(id: string, opts: { userId?: string; admin?: boolean }) {
    return prisma.$transaction(async (tx) => {
        const s = await tx.counsellingSession.findFirst({
            where: { id, ...(opts.userId ? { userId: opts.userId } : {}) },
            select: { status: true, scheduledAt: true, subscriptionId: true },
        });
        if (!s) return "NOT_FOUND" as const;
        if (s.status === "COMPLETED" || s.status === "CANCELLED") return "CLOSED" as const;

        const claimed = await tx.counsellingSession.updateMany({
            where: { id, status: s.status },
            data: { status: "CANCELLED" },
        });
        if (claimed.count === 0) return "CLOSED" as const;

        const late =
            !opts.admin &&
            s.status === "SCHEDULED" &&
            !!s.scheduledAt &&
            s.scheduledAt.getTime() - Date.now() < DAY;

        if (!late) {
            await tx.subscription.updateMany({
                where: { id: s.subscriptionId, sessionsUsed: { gt: 0 } },
                data: { sessionsUsed: { decrement: 1 } },
            });
        }
        return late ? ("NO_REFUND" as const) : ("REFUNDED" as const);
    });
}