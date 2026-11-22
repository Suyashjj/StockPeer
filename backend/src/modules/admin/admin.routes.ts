import { NextFunction, Response, Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { decrypt } from "../../lib/crypto";
import { signedUrl } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AuthedRequest, requireAuth } from "../../middleware/auth";
import premiumRoutes from "./premium.routes";
import sessionsAdmin from "../sessions/sessions.admin";
import supportAdmin from "../support/support.admin";

const router = Router();

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
    if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
    next();
}

router.use(requireAuth, requireAdmin);
router.use("/premium", premiumRoutes);
router.use("/sessions", sessionsAdmin);
router.use("/support", supportAdmin);

const decisionSchema = z
    .object({ approve: z.boolean(), reason: z.string().trim().max(300).optional() })
    .refine((d) => d.approve || !!d.reason, {
        message: "A reason is required when rejecting",
        path: ["reason"],
    });

/* ---------------- PAN reviews ---------------- */

router.get(
    "/pan/pending",
    asyncHandler(async (_req, res: Response) => {
        const items = await prisma.userProfile.findMany({
            where: { panStatus: "PENDING" },
            orderBy: { panSubmittedAt: "asc" },
            select: {
                userId: true,
                panMasked: true,
                panSubmittedAt: true,
                user: { select: { name: true, email: true } },
            },
        });
        res.json({ items });
    })
);

router.get(
    "/pan/:userId",
    asyncHandler(async (req, res: Response) => {
        const p = await prisma.userProfile.findUnique({
            where: { userId: req.params.userId },
            include: { user: { select: { name: true, email: true, phone: true } } },
        });
        if (!p || !p.panEncrypted || !p.panDocumentPublicId) {
            return res.status(404).json({ message: "No PAN submission found" });
        }
        res.json({
            user: p.user,
            dateOfBirth: p.dateOfBirth,
            pan: decrypt(p.panEncrypted),
            documentUrl: signedUrl(p.panDocumentPublicId),
            status: p.panStatus,
            submittedAt: p.panSubmittedAt,
        });
    })
);

router.post(
    "/pan/:userId/decision",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const parsed = decisionSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        const { approve, reason } = parsed.data;

        const result = await prisma.userProfile.updateMany({
            where: { userId: req.params.userId as string, panStatus: "PENDING" },
            data: {
                panStatus: approve ? "VERIFIED" : "REJECTED",
                panReviewedAt: new Date(),
                panReviewedById: req.user!.id,
                panRejectReason: approve ? null : reason,
            },
        });
        if (result.count === 0) {
            return res.status(409).json({ message: "This submission is not pending" });
        }
        res.json({ message: approve ? "PAN verified" : "PAN rejected" });
    })
);

/* ---------------- Expert reviews ---------------- */

router.get(
    "/experts/pending",
    asyncHandler(async (_req, res: Response) => {
        const items = await prisma.expertProfile.findMany({
            where: { applicationStatus: "PENDING" },
            orderBy: { submittedAt: "asc" },
            select: {
                userId: true,
                expertType: true,
                submittedAt: true,
                user: { select: { name: true, email: true } },
            },
        });
        res.json({ items });
    })
);

router.get(
    "/experts/:userId",
    asyncHandler(async (req, res: Response) => {
        const e = await prisma.expertProfile.findUnique({
            where: { userId: req.params.userId },
            include: { user: { select: { name: true, email: true, phone: true } } },
        });
        if (!e) return res.status(404).json({ message: "Application not found" });
        res.json({
            user: e.user,
            expertType: e.expertType,
            credentialNumber: e.credentialNumber,
            profileLink: e.profileLink,
            experienceYears: e.experienceYears,
            expertise: e.expertise,
            bio: e.bio,
            photoUrl: e.photoUrl,
            pan: decrypt(e.panEncrypted),
            idDocumentUrl: signedUrl(e.idDocumentPublicId),
            proofDocumentUrl: signedUrl(e.proofDocumentPublicId),
            status: e.applicationStatus,
            submittedAt: e.submittedAt,
        });
    })
);

router.post(
    "/experts/:userId/decision",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const parsed = decisionSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        const { approve, reason } = parsed.data;
        const userId = req.params.userId as string;

        const [result] = await prisma.$transaction([
            prisma.expertProfile.updateMany({
                where: { userId, applicationStatus: "PENDING" },
                data: {
                    applicationStatus: approve ? "APPROVED" : "REJECTED",
                    reviewedAt: new Date(),
                    reviewedById: req.user!.id,
                    rejectReason: approve ? null : reason,
                },
            }),
            prisma.user.updateMany({
                where: { id: userId, role: "EXPERT" },
                data: { verificationStatus: approve ? "APPROVED" : "REJECTED" },
            }),
        ]);

        if (result.count === 0) {
            return res.status(409).json({ message: "This application is not pending" });
        }
        res.json({ message: approve ? "Expert approved" : "Expert rejected" });
    })
);

export default router;