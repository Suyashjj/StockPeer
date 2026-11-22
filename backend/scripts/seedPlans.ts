import { prisma } from "../src/lib/prisma";

// Prices in rupees (GST-inclusive), stored in paise
const PLANS = [
    { tier: "PREMIUM", months: 3, rupees: 1299, groupLimit: 10, sessionLimit: 0 },
    { tier: "PREMIUM", months: 6, rupees: 2299, groupLimit: 10, sessionLimit: 0 },
    { tier: "PREMIUM", months: 12, rupees: 3999, groupLimit: 10, sessionLimit: 0 },
    { tier: "ELITE", months: 3, rupees: 2699, groupLimit: 20, sessionLimit: 2 },
    { tier: "ELITE", months: 6, rupees: 4999, groupLimit: 20, sessionLimit: 4 },
    { tier: "ELITE", months: 12, rupees: 8999, groupLimit: 20, sessionLimit: 8 },
] as const;

async function main() {
    for (const p of PLANS) {
        const data = {
            pricePaise: p.rupees * 100,
            groupLimit: p.groupLimit,
            sessionLimit: p.sessionLimit,
            isActive: true,
        };
        await prisma.plan.upsert({
            where: { tier_months: { tier: p.tier, months: p.months } },
            create: { tier: p.tier, months: p.months, ...data },
            update: data,
        });
    }
    console.log(`Seeded ${PLANS.length} plans`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());