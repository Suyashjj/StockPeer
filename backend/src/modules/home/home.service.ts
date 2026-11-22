import { prisma } from "../../lib/prisma";
import { myStocks } from "../stocks/stocks.service";
import { suggestFor } from "./recs.rules";

async function trending(userId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const counts = await prisma.message.groupBy({
        by: ["groupId"],
        where: { createdAt: { gte: since }, deletedAt: null, group: { type: "COMMUNITY" } },
        _count: { _all: true },
        orderBy: { _count: { groupId: "desc" } },
        take: 6,
    });
    const msgBy = new Map(counts.map((c) => [c.groupId, c._count._all]));

    const groups = await prisma.group.findMany({
        where: counts.length ? { id: { in: counts.map((c) => c.groupId) } } : { type: "COMMUNITY", memberCount: { gt: 0 } },
        orderBy: counts.length ? undefined : { memberCount: "desc" },
        take: 6,
        select: {
            id: true,
            memberCount: true,
            stock: { select: { symbol: true, name: true } },
            members: { where: { userId }, select: { id: true } },
        },
    });

    return groups
        .map((g) => ({
            symbol: g.stock.symbol,
            name: g.stock.name,
            members: g.memberCount,
            messages7d: msgBy.get(g.id) ?? 0,
            joined: g.members.length > 0,
        }))
        .sort((a, b) => b.messages7d - a.messages7d);
}

async function recentlyViewed(userId: string) {
    const rows = await prisma.interactionEvent.findMany({
        where: { userId, type: "VIEW" },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
            stock: {
                select: {
                    symbol: true,
                    name: true,
                    groups: {
                        where: { type: "COMMUNITY" },
                        select: { memberCount: true, members: { where: { userId }, select: { id: true } } },
                    },
                },
            },
        },
    });

    const seen = new Set<string>();
    const out: { symbol: string; name: string; members: number; joined: boolean }[] = [];
    for (const r of rows) {
        if (seen.has(r.stock.symbol)) continue;
        seen.add(r.stock.symbol);
        const g = r.stock.groups[0];
        out.push({
            symbol: r.stock.symbol,
            name: r.stock.name,
            members: g?.memberCount ?? 0,
            joined: (g?.members.length ?? 0) > 0,
        });
        if (out.length === 8) break;
    }
    return out;
}

export async function getHome(userId: string) {
    const now = new Date();
    const [user, sub, chats, suggested, trend, session, recent] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                profile: {
                    select: {
                        panStatus: true,
                        photoUrl: true,
                        dateOfBirth: true,
                        city: true,
                        experienceLevel: true,
                        riskComfort: true,
                        sectorsOfInterest: true,
                    },
                },
            },
        }),
        prisma.subscription.findFirst({
            where: { userId, status: "ACTIVE", endsAt: { gt: now } },
            orderBy: { endsAt: "desc" },
            select: { id: true, endsAt: true, plan: { select: { tier: true } } },
        }),
        myStocks(userId),
        suggestFor(userId, 8),
        trending(userId),
        prisma.counsellingSession.findFirst({
            where: { userId, status: "SCHEDULED", scheduledAt: { gte: now } },
            orderBy: { scheduledAt: "asc" },
            select: { topic: true, scheduledAt: true, meetingLink: true, expert: { select: { name: true } } },
        }),
        recentlyViewed(userId),
    ]);

    const p = user?.profile;
    const checks: [string, boolean][] = [
        ["Experience level", !!p?.experienceLevel],
        ["Risk comfort", !!p?.riskComfort],
        ["Sectors of interest", (p?.sectorsOfInterest.length ?? 0) > 0],
        ["Date of birth", !!p?.dateOfBirth],
        ["City", !!p?.city],
        ["Profile photo", !!p?.photoUrl],
    ];
    const missing = checks.filter(([, ok]) => !ok).map(([l]) => l);

    let premium: {
        symbol: string;
        name: string;
        experts: number;
        unlocked: boolean;
    }[] = [];
    if (sub) {
        const groups = await prisma.group.findMany({
            where: { type: "PREMIUM", expertAssignments: { some: {} } },
            orderBy: { premiumAccess: { _count: "desc" } },
            take: 6,
            select: {
                stock: { select: { symbol: true, name: true } },
                _count: { select: { expertAssignments: true } },
                premiumAccess: { where: { subscriptionId: sub.id }, select: { id: true } },
            },
        });
        premium = groups.map((g) => ({
            symbol: g.stock.symbol,
            name: g.stock.name,
            experts: g._count.expertAssignments,
            unlocked: g.premiumAccess.length > 0,
        }));
    }

    return {
        name: user?.name ?? "",
        panStatus: p?.panStatus ?? "NOT_SUBMITTED",
        plan: sub ? { tier: sub.plan.tier, endsAt: sub.endsAt.toISOString() } : null,
        completion: {
            percent: Math.round(((checks.length - missing.length) / checks.length) * 100),
            missing,
        },
        continue: chats.slice(0, 4),
        suggested: suggested.items,
        algorithm: suggested.algorithm,
        trending: trend,
        premium,
        recent,
        session: session
            ? {
                topic: session.topic,
                scheduledAt: session.scheduledAt!.toISOString(),
                expert: session.expert?.name ?? null,
            }
            : null,
    };
}