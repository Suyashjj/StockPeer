import { Response, Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { displayName } from "../../lib/displayName";
import { prisma } from "../../lib/prisma";
import { AuthedRequest, requireAuth } from "../../middleware/auth";
import { cancelSession } from "./sessions.shared";

const router = Router();
router.use(requireAuth, (req: AuthedRequest, res: Response, next) =>
    req.user?.role === "USER" ? next() : res.status(403).json({ message: "Members only" })
);

const activeSub = (userId: string) =>
    prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
        orderBy: { endsAt: "desc" },
        select: { id: true, sessionsTotal: true, sessionsUsed: true },
    });

router.get(
    "/",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const userId = req.user!.id;
        const [sub, rows] = await Promise.all([
            activeSub(userId),
            prisma.counsellingSession.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 50,
                select: {
                    id: true,
                    topic: true,
                    status: true,
                    preferredAt: true,
                    scheduledAt: true,
                    meetingLink: true,
                    durationMins: true,
                    createdAt: true,
                    expert: { select: { name: true } },
                },
            }),
        ]);

        res.json({
            credits:
                sub && sub.sessionsTotal > 0
                    ? {
                        total: sub.sessionsTotal,
                        used: sub.sessionsUsed,
                        left: sub.sessionsTotal - sub.sessionsUsed,
                    }
                    : null,
            items: rows.map((r) => ({
                ...r,
                meetingLink: r.status === "SCHEDULED" ? r.meetingLink : null,
                expert: r.expert ? displayName(r.expert.name) : null,
            })),
        });
    })
);

const requestSchema = z.object({
    topic: z.string().trim().min(5, "Tell us briefly what you want to discuss").max(300),
    preferredAt: z.string().optional(),
});

router.post(
    "/",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const parsed = requestSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid request" });
        }
        const { topic, preferredAt } = parsed.data;

        let preferred: Date | null = null;
        if (preferredAt) {
            preferred = new Date(preferredAt);
            const now = Date.now();
            if (
                Number.isNaN(preferred.getTime()) ||
                preferred.getTime() < now ||
                preferred.getTime() > now + 60 * 24 * 60 * 60 * 1000
            ) {
                return res.status(400).json({ message: "Choose a time within the next 60 days" });
            }
        }

        const userId = req.user!.id;
        const out = await prisma.$transaction(async (tx) => {
            const sub = await tx.subscription.findFirst({
                where: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
                orderBy: { endsAt: "desc" },
                select: { id: true, sessionsTotal: true },
            });
            if (!sub || sub.sessionsTotal === 0) return "NO_CREDITS" as const;

            const open = await tx.counsellingSession.count({
                where: { userId, status: { in: ["REQUESTED", "SCHEDULED"] } },
            });
            if (open >= 2) return "TOO_MANY" as const;

            // Reserves one credit; fails if none are left
            const taken = await tx.subscription.updateMany({
                where: { id: sub.id, sessionsUsed: { lt: sub.sessionsTotal } },
                data: { sessionsUsed: { increment: 1 } },
            });
            if (taken.count === 0) return "NO_CREDITS" as const;

            await tx.counsellingSession.create({
                data: { userId, subscriptionId: sub.id, topic, preferredAt: preferred },
            });
            return "OK" as const;
        });

        if (out === "NO_CREDITS") {
            return res.status(403).json({ message: "You have no counselling sessions left" });
        }
        if (out === "TOO_MANY") {
            return res.status(409).json({ message: "You already have 2 open session requests" });
        }
        res.status(201).json({ ok: true });
    })
);

router.post(
    "/:id/cancel",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const r = await cancelSession(req.params.id as string, { userId: req.user!.id });
        if (r === "NOT_FOUND") return res.status(404).json({ message: "Session not found" });
        if (r === "CLOSED") return res.status(409).json({ message: "This session is already closed" });
        res.json({ refunded: r === "REFUNDED" });
    })
);

export default router;