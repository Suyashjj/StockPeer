import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { displayName } from "../../lib/displayName";

const activeSub = (userId: string) =>
    prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
        orderBy: { endsAt: "desc" },
        select: {
            id: true,
            groupLimit: true,
            plan: { select: { tier: true } },
            _count: { select: { access: true } },
        },
    });

export async function premiumStatus(userId: string, symbol: string) {
    const stock = await prisma.stock.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: { id: true },
    });
    if (!stock) return null;

    const [group, sub, demand, mine] = await Promise.all([
        prisma.group.findUnique({
            where: { stockId_type: { stockId: stock.id, type: "PREMIUM" } },
            select: {
                id: true,
                expertAssignments: { select: { expert: { select: { name: true } } } },
                _count: { select: { premiumAccess: true } },
            },
        }),
        activeSub(userId),
        prisma.expertDemand.count({ where: { stockId: stock.id } }),
        prisma.expertDemand.findUnique({
            where: { userId_stockId: { userId, stockId: stock.id } },
            select: { id: true },
        }),
    ]);

    const unlocked = group
        ? !!(await prisma.premiumAccess.findFirst({
            where: {
                groupId: group.id,
                subscription: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
            },
            select: { id: true },
        }))
        : false;

    const experts = (group?.expertAssignments ?? []).map((a) => displayName(a.expert.name));

    return {
        hasExpert: experts.length > 0,
        experts,
        members: group?._count.premiumAccess ?? 0,
        unlocked,
        subscription: sub
            ? { tier: sub.plan.tier, groupsUsed: sub._count.access, groupLimit: sub.groupLimit }
            : null,
        demand,
        requested: !!mine,
    };
}

export async function unlockGroup(userId: string, symbol: string) {
    const group = await prisma.group.findFirst({
        where: { type: "PREMIUM", stock: { symbol: symbol.toUpperCase() } },
        select: { id: true, _count: { select: { expertAssignments: true } } },
    });
    if (!group || group._count.expertAssignments === 0) return "NO_EXPERT" as const;

    try {
        return await prisma.$transaction(async (tx) => {
            const sub = await tx.subscription.findFirst({
                where: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
                orderBy: { endsAt: "desc" },
                select: { id: true, groupLimit: true },
            });
            if (!sub) return "NO_PLAN" as const;

            const existing = await tx.premiumAccess.findUnique({
                where: { subscriptionId_groupId: { subscriptionId: sub.id, groupId: group.id } },
            });
            if (existing) return "ALREADY" as const;

            const used = await tx.premiumAccess.count({ where: { subscriptionId: sub.id } });
            if (used >= sub.groupLimit) return "LIMIT" as const;

            await tx.premiumAccess.create({
                data: { subscriptionId: sub.id, groupId: group.id },
            });
            return "OK" as const;
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return "ALREADY" as const;
        }
        throw e;
    }
}

export async function requestExpert(userId: string, symbol: string) {
    const stock = await prisma.stock.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: { id: true },
    });
    if (!stock) return "NOT_FOUND" as const;

    const experts = await prisma.expertAssignment.count({
        where: { group: { stockId: stock.id, type: "PREMIUM" } },
    });
    if (experts > 0) return "HAS_EXPERT" as const;

    await prisma.expertDemand.upsert({
        where: { userId_stockId: { userId, stockId: stock.id } },
        create: { userId, stockId: stock.id },
        update: {},
    });
    return "OK" as const;
}