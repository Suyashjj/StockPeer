import { prisma } from "../src/lib/prisma";

async function main() {
    const mems = await prisma.membership.findMany({
        where: { group: { type: "COMMUNITY" } },
        select: { userId: true, joinedAt: true, group: { select: { stockId: true } } },
    });
    const existing = await prisma.interactionEvent.count({ where: { type: "JOIN" } });
    if (existing > 0) return console.log("JOIN events already exist, skipping");

    await prisma.interactionEvent.createMany({
        data: mems.map((m) => ({
            userId: m.userId,
            stockId: m.group.stockId,
            type: "JOIN" as const,
            createdAt: m.joinedAt,
        })),
    });
    console.log(`Created ${mems.length} JOIN events`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());