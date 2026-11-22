import { Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../../middleware/auth";

const DEFAULT_MAX = 2;

export const opportunities = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const expertId = req.user!.id;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [groups, msgCounts, demands, premiums, pending] = await Promise.all([
        prisma.group.findMany({
            where: { type: "COMMUNITY", memberCount: { gt: 0 } },
            orderBy: { memberCount: "desc" },
            take: 300,
            select: {
                id: true,
                memberCount: true,
                stockId: true,
                stock: { select: { symbol: true, name: true } },
            },
        }),
        prisma.message.groupBy({
            by: ["groupId"],
            where: { createdAt: { gte: since }, deletedAt: null, group: { type: "COMMUNITY" } },
            _count: { _all: true },
        }),
        prisma.expertDemand.groupBy({ by: ["stockId"], _count: { _all: true } }),
        prisma.group.findMany({
            where: { type: "PREMIUM" },
            select: {
                stockId: true,
                maxExperts: true,
                expertAssignments: { select: { expertId: true } },
            },
        }),
        prisma.expertRequest.findMany({
            where: { expertId, status: "PENDING" },
            select: { stockId: true },
        }),
    ]);

    const msgByGroup = new Map(msgCounts.map((m) => [m.groupId, m._count._all]));
    const demandByStock = new Map(demands.map((d) => [d.stockId, d._count._all]));
    const premiumByStock = new Map(premiums.map((p) => [p.stockId, p]));
    const appliedStocks = new Set(pending.map((p) => p.stockId));

    const items = groups
        .map((g) => {
            const p = premiumByStock.get(g.stockId);
            const max = p?.maxExperts ?? DEFAULT_MAX;
            const taken = p?.expertAssignments.length ?? 0;
            const mine = p?.expertAssignments.some((a) => a.expertId === expertId) ?? false;
            const messages7d = msgByGroup.get(g.id) ?? 0;
            const requests = demandByStock.get(g.stockId) ?? 0;
            return {
                symbol: g.stock.symbol,
                name: g.stock.name,
                members: g.memberCount,
                messages7d,
                requests,
                slotsLeft: max - taken,
                applied: appliedStocks.has(g.stockId),
                mine,
                score: messages7d * 2 + g.memberCount + requests * 5,
            };
        })
        .filter((i) => i.slotsLeft > 0 && !i.mine)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)
        .map(({ mine, score, ...rest }) => rest);

    res.json({ items });
});

const applySchema = z.object({
    symbol: z.string().trim().min(1).max(30),
    note: z.string().trim().max(300).optional(),
});

export const apply = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request" });
    const { symbol, note } = parsed.data;
    const expertId = req.user!.id;

    const stock = await prisma.stock.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: { id: true, isActive: true },
    });
    if (!stock || !stock.isActive) return res.status(404).json({ message: "Stock not found" });

    const group = await prisma.group.findUnique({
        where: { stockId_type: { stockId: stock.id, type: "PREMIUM" } },
        select: { maxExperts: true, expertAssignments: { select: { expertId: true } } },
    });
    if (group?.expertAssignments.some((a) => a.expertId === expertId)) {
        return res.status(409).json({ message: "You already guide this group" });
    }
    if (group && group.expertAssignments.length >= group.maxExperts) {
        return res.status(409).json({ message: "This group has no free expert slot" });
    }

    const existing = await prisma.expertRequest.findFirst({
        where: { expertId, stockId: stock.id, status: "PENDING" },
        select: { id: true },
    });
    if (existing) return res.status(409).json({ message: "You already applied for this stock" });

    await prisma.expertRequest.create({
        data: { expertId, stockId: stock.id, note: note || null },
    });
    res.status(201).json({ ok: true });
});

export const myRequests = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const rows = await prisma.expertRequest.findMany({
        where: { expertId: req.user!.id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
            id: true,
            status: true,
            rejectReason: true,
            createdAt: true,
            stock: { select: { symbol: true, name: true } },
        },
    });
    res.json({ items: rows });
});

export const myGroups = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const rows = await prisma.expertAssignment.findMany({
        where: { expertId: req.user!.id, group: { type: "PREMIUM" } },
        orderBy: { assignedAt: "desc" },
        select: {
            group: {
                select: {
                    stock: { select: { symbol: true, name: true } },
                    _count: { select: { premiumAccess: true } },
                },
            },
        },
    });
    res.json({
        items: rows.map((r) => ({
            symbol: r.group.stock.symbol,
            name: r.group.stock.name,
            unlockedBy: r.group._count.premiumAccess,
        })),
    });
});