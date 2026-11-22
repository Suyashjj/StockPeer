import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { displayName } from "../../lib/displayName";

export async function isPanVerified(userId: string) {
    const p = await prisma.userProfile.findUnique({
        where: { userId },
        select: { panStatus: true },
    });
    return p?.panStatus === "VERIFIED";
}

type SearchParams = { q?: string; sector?: string; page: number; limit: number };

const listSelect = (userId: string) =>
    ({
        id: true,
        symbol: true,
        name: true,
        sector: true,
        groups: {
            select: {
                type: true,
                memberCount: true,
                members: { where: { userId }, select: { id: true } },
            },
        },
    }) satisfies Prisma.StockSelect;

type Row = Prisma.StockGetPayload<{ select: ReturnType<typeof listSelect> }>;

function shape(s: Row) {
    const community = s.groups.find((g) => g.type === "COMMUNITY");
    return {
        id: s.id,
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
        memberCount: community?.memberCount ?? 0,
        joined: (community?.members.length ?? 0) > 0,
        hasPremium: s.groups.some((g) => g.type === "PREMIUM"),
    };
}

export async function searchStocks(userId: string, { q, sector, page, limit }: SearchParams) {
    const where: Prisma.StockWhereInput = {
        isActive: true,
        ...(sector ? { sector } : {}),
        ...(q
            ? {
                OR: [
                    { symbol: { contains: q, mode: "insensitive" } },
                    { name: { contains: q, mode: "insensitive" } },
                ],
            }
            : {}),
    };

    const [total, rows] = await Promise.all([
        prisma.stock.count({ where }),
        prisma.stock.findMany({
            where,
            orderBy: { symbol: "asc" },
            skip: (page - 1) * limit,
            take: limit,
            select: listSelect(userId),
        }),
    ]);

    return { items: rows.map(shape), total, page, limit };
}

export async function getStock(userId: string, symbol: string) {
    const s = await prisma.stock.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: listSelect(userId),
    });
    return s ? shape(s) : null;
}

// Creates the community group on the first join, then adds the member. Safe to call twice.
export async function joinStock(userId: string, symbol: string) {
    const stock = await prisma.stock.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: { id: true, isActive: true },
    });
    if (!stock || !stock.isActive) return "NOT_FOUND" as const;

    try {
        return await prisma.$transaction(async (tx) => {
            const group = await tx.group.upsert({
                where: { stockId_type: { stockId: stock.id, type: "COMMUNITY" } },
                create: { stockId: stock.id, type: "COMMUNITY", createdById: userId },
                update: {},
            });

            const existing = await tx.membership.findUnique({
                where: { userId_groupId: { userId, groupId: group.id } },
            });
            if (existing) return "ALREADY" as const;

            await tx.membership.create({ data: { userId, groupId: group.id } });
            await tx.group.update({
                where: { id: group.id },
                data: { memberCount: { increment: 1 } },
            });
            return "JOINED" as const;
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return "ALREADY" as const;
        }
        throw e;
    }
}

export async function leaveStock(userId: string, symbol: string) {
    const group = await prisma.group.findFirst({
        where: { type: "COMMUNITY", stock: { symbol: symbol.toUpperCase() } },
        select: { id: true },
    });
    if (!group) return false;

    return prisma.$transaction(async (tx) => {
        const removed = await tx.membership.deleteMany({ where: { userId, groupId: group.id } });
        if (removed.count === 0) return false;
        await tx.group.update({
            where: { id: group.id },
            data: { memberCount: { decrement: 1 } },
        });
        return true;
    });
}

export async function myStocks(userId: string) {
    const rows = await prisma.membership.findMany({
        where: { userId, group: { type: "COMMUNITY" } },
        select: {
            joinedAt: true,
            lastReadAt: true,
            group: {
                select: {
                    id: true,
                    memberCount: true,
                    stock: { select: { id: true, symbol: true, name: true, sector: true } },
                },
            },
        },
    });

    const items = await Promise.all(
        rows.map(async (r) => {
            const [last, unread] = await Promise.all([
                prisma.message.findFirst({
                    where: { groupId: r.group.id, deletedAt: null },
                    orderBy: { createdAt: "desc" },
                    select: {
                        body: true,
                        createdAt: true,
                        senderId: true,
                        fileId: true,
                        fileType: true,
                        fileName: true,
                        sender: { select: { name: true } },
                    },
                }),
                prisma.message.count({
                    where: {
                        groupId: r.group.id,
                        deletedAt: null,
                        senderId: { not: userId },
                        createdAt: { gt: r.lastReadAt },
                    },
                }),
            ]);

            return {
                id: r.group.stock.id,
                symbol: r.group.stock.symbol,
                name: r.group.stock.name,
                sector: r.group.stock.sector,
                memberCount: r.group.memberCount,
                joined: true,
                unread,
                lastMessage: last
                    ? {
                        body:
                            last.body ||
                            (last.fileId
                                ? last.fileType?.startsWith("image/")
                                    ? "📷 Photo"
                                    : `📄 ${last.fileName ?? "File"}`
                                : ""),
                        createdAt: last.createdAt.toISOString(),
                        senderName: displayName(last.sender.name),
                        mine: last.senderId === userId,
                    }
                    : null,
                sortKey: (last?.createdAt ?? r.joinedAt).getTime(),
            };
        })
    );

    return items.sort((a, b) => b.sortKey - a.sortKey).map(({ sortKey, ...rest }) => rest);
}