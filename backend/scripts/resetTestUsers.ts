import { prisma } from "../src/lib/prisma";

async function main() {
    const users = await prisma.user.findMany({
        where: { role: { not: "ADMIN" } },
        select: { id: true },
    });
    const ids = users.map((u) => u.id);

    // These have no cascade, so remove them first
    await prisma.counsellingSession.deleteMany({ where: { userId: { in: ids } } });
    await prisma.payment.deleteMany({ where: { userId: { in: ids } } });
    await prisma.subscription.deleteMany({ where: { userId: { in: ids } } });

    const r = await prisma.user.deleteMany({ where: { id: { in: ids } } });
    console.log(`Deleted ${r.count} users`);

    // Optional: remove groups nobody belongs to now, and reset counts
    await prisma.group.updateMany({ data: { memberCount: 0 } });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());