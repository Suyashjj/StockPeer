import { Response, Router } from "express";
import type { ExpertType } from "@prisma/client";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../../middleware/auth";

// Admin check already runs in admin.routes.ts before this router
const router = Router();

const ELIGIBLE_TYPES: ExpertType[] = ["SEBI_RA", "SEBI_IA"];

const eligibleExpert = {
    role: "EXPERT" as const,
    accountStatus: "ACTIVE" as const,
    verificationStatus: "APPROVED" as const,
    expertProfile: {
        is: { applicationStatus: "APPROVED" as const, expertType: { in: ELIGIBLE_TYPES } },
    },
};

// Experts who can be assigned
router.get(
    "/experts",
    asyncHandler(async (_req, res: Response) => {
        const rows = await prisma.user.findMany({
            where: eligibleExpert,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                email: true,
                expertProfile: { select: { expertType: true } },
            },
        });
        res.json({
            items: rows.map((r) => ({
                id: r.id,
                name: r.name,
                email: r.email,
                expertType: r.expertProfile?.expertType,
            })),
        });
    })
);

// Search stocks to assign
router.get(
    "/stocks",
    asyncHandler(async (req, res: Response) => {
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
        if (q.length < 2) return res.json({ items: [] });

        const rows = await prisma.stock.findMany({
            where: {
                isActive: true,
                OR: [
                    { symbol: { contains: q, mode: "insensitive" } },
                    { name: { contains: q, mode: "insensitive" } },
                ],
            },
            orderBy: { symbol: "asc" },
            take: 10,
            select: {
                symbol: true,
                name: true,
                groups: { where: { type: "PREMIUM" }, select: { id: true } },
            },
        });
        res.json({
            items: rows.map((r) => ({
                symbol: r.symbol,
                name: r.name,
                hasPremium: r.groups.length > 0,
            })),
        });
    })
);

// All premium groups with their experts
router.get(
    "/groups",
    asyncHandler(async (_req, res: Response) => {
        const rows = await prisma.group.findMany({
            where: { type: "PREMIUM" },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                maxExperts: true,
                createdAt: true,
                stock: { select: { symbol: true, name: true } },
                expertAssignments: {
                    select: { expert: { select: { id: true, name: true } } },
                },
                _count: { select: { premiumAccess: true } },
            },
        });
        res.json({
            items: rows.map((g) => ({
                id: g.id,
                maxExperts: g.maxExperts,
                symbol: g.stock.symbol,
                name: g.stock.name,
                unlockedBy: g._count.premiumAccess,
                experts: g.expertAssignments.map((a) => a.expert),
            })),
        });
    })
);

const assignSchema = z.object({
    symbol: z.string().trim().min(1).max(30),
    expertId: z.string().trim().min(1),
});

// Assign an expert to a stock. Creates the premium group if needed.
router.post(
    "/assign",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const parsed = assignSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Invalid request" });
        const { symbol, expertId } = parsed.data;

        const stock = await prisma.stock.findUnique({
            where: { symbol: symbol.toUpperCase() },
            select: { id: true, isActive: true },
        });
        if (!stock || !stock.isActive) return res.status(404).json({ message: "Stock not found" });

        const expert = await prisma.user.findFirst({
            where: { id: expertId, ...eligibleExpert },
            select: { id: true },
        });
        if (!expert) {
            return res.status(400).json({
                message: "Only approved SEBI Research Analysts or Investment Advisers can be assigned",
            });
        }

        const current = await prisma.group.findUnique({
            where: { stockId_type: { stockId: stock.id, type: "PREMIUM" } },
            select: { maxExperts: true, expertAssignments: { select: { expertId: true } } },
        });
        if (
            current &&
            !current.expertAssignments.some((a) => a.expertId === expertId) &&
            current.expertAssignments.length >= current.maxExperts
        ) {
            return res
                .status(409)
                .json({ message: `This group already has ${current.maxExperts} experts` });
        }

        const groupId = await prisma.$transaction(async (tx) => {
            const group = await tx.group.upsert({
                where: { stockId_type: { stockId: stock.id, type: "PREMIUM" } },
                create: { stockId: stock.id, type: "PREMIUM", createdById: req.user!.id },
                update: {},
            });
            await tx.expertAssignment.upsert({
                where: { groupId_expertId: { groupId: group.id, expertId } },
                create: { groupId: group.id, expertId },
                update: {},
            });
            return group.id;
        });

        res.status(201).json({ groupId });
    })
);

// Remove an expert from a group
router.delete(
    "/groups/:groupId/experts/:expertId",
    asyncHandler(async (req, res: Response) => {
        const groupId = req.params.groupId as string;
        const expertId = req.params.expertId as string;

        const [experts, unlocked] = await Promise.all([
            prisma.expertAssignment.count({ where: { groupId } }),
            prisma.premiumAccess.count({ where: { groupId } }),
        ]);

        // A group people already unlocked must keep at least one expert
        if (unlocked > 0 && experts <= 1) {
            return res.status(409).json({
                message: "Members have unlocked this group. Assign another expert before removing the last one.",
            });
        }

        await prisma.expertAssignment.deleteMany({ where: { groupId, expertId } });
        res.json({ ok: true });
    })
);

const requestDecision = z
    .object({ approve: z.boolean(), reason: z.string().trim().max(300).optional() })
    .refine((d) => d.approve || !!d.reason, {
        message: "A reason is required when rejecting",
        path: ["reason"],
    });

// Pending expert requests, with how busy each stock is
router.get(
    "/requests",
    asyncHandler(async (_req, res: Response) => {
        const rows = await prisma.expertRequest.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                note: true,
                createdAt: true,
                expert: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        expertProfile: {
                            select: {
                                expertType: true,
                                experienceYears: true,
                                expertise: true,
                                bio: true,
                            },
                        },
                    },
                },
                stock: { select: { id: true, symbol: true, name: true } },
            },
        });

        const stockIds = rows.map((r) => r.stock.id);
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [premium, community, demand] = await Promise.all([
            prisma.group.findMany({
                where: { type: "PREMIUM", stockId: { in: stockIds } },
                select: {
                    stockId: true,
                    maxExperts: true,
                    _count: { select: { expertAssignments: true } },
                },
            }),
            prisma.group.findMany({
                where: { type: "COMMUNITY", stockId: { in: stockIds } },
                select: { id: true, stockId: true, memberCount: true },
            }),
            prisma.expertDemand.groupBy({
                by: ["stockId"],
                where: { stockId: { in: stockIds } },
                _count: { _all: true },
            }),
        ]);
        const msgs = await prisma.message.groupBy({
            by: ["groupId"],
            where: {
                groupId: { in: community.map((c) => c.id) },
                createdAt: { gte: since },
                deletedAt: null,
            },
            _count: { _all: true },
        });

        const msgByGroup = new Map(msgs.map((m) => [m.groupId, m._count._all]));
        const prem = new Map(premium.map((p) => [p.stockId, p]));
        const comm = new Map(community.map((c) => [c.stockId, c]));
        const dem = new Map(demand.map((d) => [d.stockId, d._count._all]));

        res.json({
            items: rows.map((r) => {
                const p = prem.get(r.stock.id);
                const c = comm.get(r.stock.id);
                return {
                    id: r.id,
                    note: r.note,
                    createdAt: r.createdAt,
                    expert: {
                        name: r.expert.name,
                        email: r.expert.email,
                        ...r.expert.expertProfile,
                    },
                    stock: { symbol: r.stock.symbol, name: r.stock.name },
                    experts: p?._count.expertAssignments ?? 0,
                    maxExperts: p?.maxExperts ?? 2,
                    members: c?.memberCount ?? 0,
                    messages7d: c ? (msgByGroup.get(c.id) ?? 0) : 0,
                    requests: dem.get(r.stock.id) ?? 0,
                };
            }),
        });
    })
);

router.post(
    "/requests/:id/decision",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        const parsed = requestDecision.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: parsed.error.issues[0]?.message ?? "Invalid request",
            });
        }
        const { approve, reason } = parsed.data;
        const id = req.params.id as string;

        const r = await prisma.expertRequest.findUnique({
            where: { id },
            select: { id: true, status: true, expertId: true, stockId: true },
        });
        if (!r || r.status !== "PENDING") {
            return res.status(409).json({ message: "This request is not pending" });
        }

        if (!approve) {
            await prisma.expertRequest.updateMany({
                where: { id, status: "PENDING" },
                data: {
                    status: "REJECTED",
                    rejectReason: reason,
                    reviewedAt: new Date(),
                    reviewedById: req.user!.id,
                },
            });
            return res.json({ message: "Request rejected" });
        }

        const expert = await prisma.user.findFirst({
            where: { id: r.expertId, ...eligibleExpert },
            select: { id: true },
        });
        if (!expert) {
            return res.status(400).json({ message: "This expert is no longer eligible" });
        }

        const out = await prisma.$transaction(async (tx) => {
            const group = await tx.group.upsert({
                where: { stockId_type: { stockId: r.stockId, type: "PREMIUM" } },
                create: { stockId: r.stockId, type: "PREMIUM", createdById: req.user!.id },
                update: {},
            });
            const assigns = await tx.expertAssignment.findMany({
                where: { groupId: group.id },
                select: { expertId: true },
            });
            if (!assigns.some((a) => a.expertId === r.expertId)) {
                if (assigns.length >= group.maxExperts) return "FULL" as const;
                await tx.expertAssignment.create({
                    data: { groupId: group.id, expertId: r.expertId },
                });
            }
            await tx.expertRequest.updateMany({
                where: { id: r.id, status: "PENDING" },
                data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: req.user!.id },
            });
            return "OK" as const;
        });

        if (out === "FULL") {
            return res.status(409).json({
                message: "This group is full. Raise its expert limit first, or reject the request.",
            });
        }
        res.json({ message: "Expert assigned" });
    })
);

// Raise or lower the expert limit (2 or 3)
router.patch(
    "/groups/:groupId/max-experts",
    asyncHandler(async (req, res: Response) => {
        const parsed = z
            .object({ maxExperts: z.number().int().min(2).max(3) })
            .safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Limit must be 2 or 3" });

        const groupId = req.params.groupId as string;
        const count = await prisma.expertAssignment.count({ where: { groupId } });
        if (parsed.data.maxExperts < count) {
            return res
                .status(409)
                .json({ message: `Remove an expert first. This group has ${count}.` });
        }
        await prisma.group.updateMany({
            where: { id: groupId, type: "PREMIUM" },
            data: { maxExperts: parsed.data.maxExperts },
        });
        res.json({ ok: true });
    })
);

export default router;