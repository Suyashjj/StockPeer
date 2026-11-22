import { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { displayName } from "../../lib/displayName";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../../middleware/auth";

export const mySessions = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const rows = await prisma.counsellingSession.findMany({
        where: { expertId: req.user!.id, status: { in: ["SCHEDULED", "COMPLETED"] } },
        orderBy: { scheduledAt: "desc" },
        take: 50,
        select: {
            id: true,
            topic: true,
            status: true,
            scheduledAt: true,
            meetingLink: true,
            durationMins: true,
            user: { select: { name: true } },
        },
    });
    res.json({
        items: rows.map((r) => ({ ...r, user: displayName(r.user.name) })),
    });
});

export const completeSession = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const r = await prisma.counsellingSession.updateMany({
        where: { id: req.params.id as string, expertId: req.user!.id, status: "SCHEDULED" },
        data: { status: "COMPLETED" },
    });
    if (r.count === 0) return res.status(409).json({ message: "This session can't be completed" });
    res.json({ ok: true });
});