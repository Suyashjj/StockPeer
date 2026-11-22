import { Response, Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../../middleware/auth";
import { cancelSession } from "./sessions.shared";

// Admin check already runs in admin.routes.ts
const router = Router();

router.get(
    "/",
    asyncHandler(async (req, res: Response) => {
        const history = req.query.view === "history";
        const rows = await prisma.counsellingSession.findMany({
            where: {
                status: history ? { in: ["COMPLETED", "CANCELLED"] } : { in: ["REQUESTED", "SCHEDULED"] },
            },
            orderBy: history ? { updatedAt: "desc" } : { createdAt: "asc" },
            take: 100,
            select: {
                id: true,
                topic: true,
                status: true,
                preferredAt: true,
                scheduledAt: true,
                meetingLink: true,
                createdAt: true,
                user: { select: { name: true, email: true } },
                expert: { select: { id: true, name: true } },
            },
        });
        res.json({ items: rows });
    })
);

const scheduleSchema = z.object({
    expertId: z.string().min(1, "Choose an expert"),
    scheduledAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Choose a date and time"),
    meetingLink: z
        .string()
        .trim()
        .max(300)
        .regex(/^https:\/\/\S+\.\S+/, "Paste the Zoom link (starts with https://)"),
});

router.post(
    "/:id/schedule",
    asyncHandler(async (req, res: Response) => {
        const parsed = scheduleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid request" });
        }
        const { expertId, scheduledAt, meetingLink } = parsed.data;
        const when = new Date(scheduledAt);
        if (when.getTime() < Date.now()) {
            return res.status(400).json({ message: "The time must be in the future" });
        }

        const expert = await prisma.user.findFirst({
            where: {
                id: expertId,
                role: "EXPERT",
                accountStatus: "ACTIVE",
                verificationStatus: "APPROVED",
                expertProfile: {
                    is: { applicationStatus: "APPROVED", expertType: { in: ["SEBI_RA", "SEBI_IA"] } },
                },
            },
            select: { id: true },
        });
        if (!expert) {
            return res.status(400).json({
                message: "Only approved SEBI Research Analysts or Investment Advisers can take sessions",
            });
        }

        const r = await prisma.counsellingSession.updateMany({
            where: { id: req.params.id as string, status: { in: ["REQUESTED", "SCHEDULED"] } },
            data: { expertId, scheduledAt: when, meetingLink, status: "SCHEDULED" },
        });
        if (r.count === 0) return res.status(409).json({ message: "This session can't be scheduled" });
        res.json({ ok: true });
    })
);

router.post(
    "/:id/complete",
    asyncHandler(async (req, res: Response) => {
        const r = await prisma.counsellingSession.updateMany({
            where: { id: req.params.id as string, status: "SCHEDULED" },
            data: { status: "COMPLETED" },
        });
        if (r.count === 0) return res.status(409).json({ message: "Only a scheduled session can be completed" });
        res.json({ ok: true });
    })
);

router.post(
    "/:id/cancel",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const r = await cancelSession(req.params.id as string, { admin: true });
        if (r === "NOT_FOUND") return res.status(404).json({ message: "Session not found" });
        if (r === "CLOSED") return res.status(409).json({ message: "This session is already closed" });
        res.json({ refunded: true });
    })
);

export default router;