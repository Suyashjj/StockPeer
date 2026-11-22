import { prisma } from "../../lib/prisma";

type Reason = { w: number; t: string };
type Cand = {
    stockId: string;
    symbol: string;
    name: string;
    sector: string | null;
    groupId?: string;
    members: number;
    score: number;
    reasons: Reason[];
};
type StockLite = { id: string; symbol: string; name: string; sector: string | null };

export async function suggestFor(userId: string, limit = 8) {
    const [mems, profile, unlocked] = await Promise.all([
        prisma.membership.findMany({
            where: { userId, group: { type: "COMMUNITY" } },
            select: { groupId: true, group: { select: { stockId: true } } },
        }),
        prisma.userProfile.findUnique({ where: { userId }, select: { sectorsOfInterest: true } }),
        prisma.premiumAccess.findMany({
            where: { subscription: { userId } },
            select: { group: { select: { expertAssignments: { select: { expertId: true } } } } },
        }),
    ]);

    const myGroupIds = mems.map((m) => m.groupId);
    const mine = [...new Set(mems.map((m) => m.group.stockId))];
    const sectors = profile?.sectorsOfInterest ?? [];
    const myExperts = [...new Set(unlocked.flatMap((u) => u.group.expertAssignments.map((a) => a.expertId)))];

    const groupSel = { where: { type: "COMMUNITY" as const }, select: { id: true, memberCount: true } };
    const stockSel = { id: true, symbol: true, name: true, sector: true };

    const [popular, bySector, byExpert] = await Promise.all([
        prisma.group.findMany({
            where: { type: "COMMUNITY", memberCount: { gt: 0 }, stockId: { notIn: mine } },
            orderBy: { memberCount: "desc" },
            take: 200,
            select: { id: true, memberCount: true, stock: { select: stockSel } },
        }),
        sectors.length
            ? prisma.stock.findMany({
                where: { isActive: true, sector: { in: sectors }, id: { notIn: mine } },
                take: 60,
                select: { ...stockSel, groups: groupSel },
            })
            : Promise.resolve([]),
        myExperts.length
            ? prisma.expertAssignment.findMany({
                where: {
                    expertId: { in: myExperts },
                    group: { type: "PREMIUM", stockId: { notIn: mine } },
                },
                select: { group: { select: { stock: { select: { ...stockSel, groups: groupSel } } } } },
            })
            : Promise.resolve([]),
    ]);

    const map = new Map<string, Cand>();
    function cand(s: StockLite, groupId?: string, members = 0) {
        let c = map.get(s.id);
        if (!c) {
            c = { stockId: s.id, symbol: s.symbol, name: s.name, sector: s.sector, members: 0, score: 0, reasons: [] };
            map.set(s.id, c);
        }
        if (groupId && !c.groupId) {
            c.groupId = groupId;
            c.members = members;
        }
        return c;
    }
    const add = (c: Cand, w: number, t: string) => {
        c.score += w;
        c.reasons.push({ w, t });
    };

    // Signal 1: popularity
    for (const g of popular) {
        const c = cand(g.stock, g.id, g.memberCount);
        add(c, Math.log10(1 + g.memberCount) * 0.5, "Popular with members");
    }
    // Signal 2: sectors of interest
    for (const s of bySector) {
        const g = s.groups[0];
        const c = cand(s, g?.id, g?.memberCount ?? 0);
        add(c, 3, `Matches your interest in ${s.sector}`);
    }
    // Signal 3: experts you already follow
    for (const a of byExpert) {
        const s = a.group.stock;
        const g = s.groups[0];
        const c = cand(s, g?.id, g?.memberCount ?? 0);
        add(c, 2.5, "Guided by an expert you follow");
    }

    // Signal 4: mutual people (counts only, never names)
    const groupIds = [...map.values()].map((c) => c.groupId).filter((x): x is string => !!x);
    if (myGroupIds.length && groupIds.length) {
        const peers = await prisma.membership.findMany({
            where: { groupId: { in: myGroupIds }, userId: { not: userId } },
            select: { userId: true },
            distinct: ["userId"],
            take: 500,
        });
        if (peers.length) {
            const counts = await prisma.membership.groupBy({
                by: ["groupId"],
                where: { userId: { in: peers.map((p) => p.userId) }, groupId: { in: groupIds } },
                _count: { _all: true },
            });
            const byGroup = new Map(counts.map((c) => [c.groupId, c._count._all]));
            for (const c of map.values()) {
                const n = c.groupId ? (byGroup.get(c.groupId) ?? 0) : 0;
                if (n > 0) {
                    add(c, Math.min(n, 10) * 0.6, `${n} ${n === 1 ? "person" : "people"} from your groups ${n === 1 ? "is" : "are"} here`);
                }
            }
        }
    }

    // Signal 5: activity this week
    if (groupIds.length) {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const msgs = await prisma.message.groupBy({
            by: ["groupId"],
            where: { groupId: { in: groupIds }, createdAt: { gte: since }, deletedAt: null },
            _count: { _all: true },
        });
        const byGroup = new Map(msgs.map((m) => [m.groupId, m._count._all]));
        for (const c of map.values()) {
            const n = c.groupId ? (byGroup.get(c.groupId) ?? 0) : 0;
            if (n > 0) add(c, Math.min(n, 30) * 0.1, "Active this week");
        }
    }

    const items = [...map.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((c) => ({
            symbol: c.symbol,
            name: c.name,
            sector: c.sector,
            members: c.members,
            score: Math.round(c.score * 100) / 100,
            reason: [...c.reasons].sort((a, b) => b.w - a.w)[0]?.t ?? "Be the first here",
        }));

    return { items, algorithm: "rules" as const };
}