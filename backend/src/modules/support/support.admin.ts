import { Response, Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { signedUrl } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../../middleware/auth";
import { REVERIFY, applyChange, displayNew } from "./support.service";

// Admin check already runs in admin.routes.ts
const router = Router();

router.get(
    "/",
    asyncHandler(async (req, res: Response) => {
        const history = req.query.view === "history";
        const rows = await prisma.supportTicket.findMany({
            where: { status: history ? { not: "OPEN" } : "OPEN" },
            orderBy: history ? { updatedAt: "desc" } : { createdAt: "asc" },
            take: 100,
            select: {
                id: true,
                kind: true,
                subject: true,
                message: true,
                field: true,
                oldValue: true,
                newValue: true,
                documentId: true,
                status: true,
                adminReply: true,
                createdAt: true,
                user: { select: { name: true, email: true, role: true } },
            },
        });
        res.json({
            items: rows.map(({ newValue, documentId, ...r }) => ({
                ...r,
                newDisplay: displayNew(r.field, newValue, true),
                documentUrl: documentId ? signedUrl(documentId) : null,
                reverifies: r.field ? REVERIFY.includes(r.field) : false,
            })),
        });
    })
);

const decisionSchema = z
    .object({ approve: z.boolean(), reason: z.string().trim().max(400).optional() })
    .refine((d) => d.approve || !!d.reason, { message: "A reason is required when rejecting" });

router.post(
    "/:id/decision",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const parsed = decisionSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid request" });
        }
        const id = req.params.id as string;

        if (parsed.data.approve) {
            const r = await applyChange(id, req.user!.id);
            if (r === "NOT_OPEN") return res.status(409).json({ message: "This request is not open" });
            if (r === "TAKEN") {
                return res.status(409).json({ message: "That value is already used by someone else. Reject this request." });
            }
            return res.json({ message: "Change applied" });
        }

        const r = await prisma.supportTicket.updateMany({
            where: { id, kind: "CHANGE", status: "OPEN" },
            data: {
                status: "REJECTED",
                adminReply: parsed.data.reason,
                reviewedById: req.user!.id,
                reviewedAt: new Date(),
            },
        });
        if (r.count === 0) return res.status(409).json({ message: "This request is not open" });
        res.json({ message: "Request rejected" });
    })
);

router.post(
    "/:id/reply",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const parsed = z.object({ reply: z.string().trim().min(2).max(1000) }).safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Write a reply" });

        const r = await prisma.supportTicket.updateMany({
            where: { id: req.params.id as string, kind: "GENERAL", status: "OPEN" },
            data: {
                status: "RESOLVED",
                adminReply: parsed.data.reply,
                reviewedById: req.user!.id,
                reviewedAt: new Date(),
            },
        });
        if (r.count === 0) return res.status(409).json({ message: "This ticket is not open" });
        res.json({ ok: true });
    })
);

export default router;