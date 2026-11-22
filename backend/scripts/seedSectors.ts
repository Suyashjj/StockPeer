import { prisma } from "../src/lib/prisma";

const SECTORS: Record<string, string[]> = {
    IT: ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "LTIM", "MPHASIS", "PERSISTENT", "COFORGE"],
    Banking: ["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "INDUSINDBK", "BANKBARODA", "PNB", "FEDERALBNK", "IDFCFIRSTB"],
    Pharma: ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "LUPIN", "AUROPHARMA", "TORNTPHARM", "ZYDUSLIFE"],
    Energy: ["RELIANCE", "ONGC", "NTPC", "POWERGRID", "COALINDIA", "BPCL", "IOC", "TATAPOWER", "ADANIGREEN"],
    Auto: ["MARUTI", "M&M", "TMPV", "TMCV", "BAJAJ-AUTO", "EICHERMOT", "HEROMOTOCO", "TVSMOTOR", "ASHOKLEY"],
    FMCG: ["HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "DABUR", "TATACONSUM", "GODREJCP", "MARICO"],
    Metals: ["TATASTEEL", "JSWSTEEL", "HINDALCO", "VEDL", "SAIL", "JINDALSTEL", "NMDC"],
    Realty: ["DLF", "GODREJPROP", "OBEROIRLTY", "PRESTIGE", "LODHA", "PHOENIXLTD"],
};

async function main() {
    let total = 0;
    for (const [sector, symbols] of Object.entries(SECTORS)) {
        const r = await prisma.stock.updateMany({
            where: { symbol: { in: symbols } },
            data: { sector },
        });
        console.log(`${sector}: ${r.count}/${symbols.length}`);
        total += r.count;
    }
    console.log(`Updated ${total} stocks`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());