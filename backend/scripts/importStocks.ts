import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

// Splits one CSV line, respecting "quoted, values"
function parseLine(line: string) {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (const ch of line) {
        if (ch === '"') quoted = !quoted;
        else if (ch === "," && !quoted) {
            out.push(cur.trim());
            cur = "";
        } else cur += ch;
    }
    out.push(cur.trim());
    return out;
}

async function main() {
    const file = path.join(__dirname, "..", "data", "EQUITY_L.csv");
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);

    const header = parseLine(lines[0]).map((h) => h.toUpperCase());
    const iSymbol = header.indexOf("SYMBOL");
    const iName = header.indexOf("NAME OF COMPANY");
    const iSeries = header.indexOf("SERIES");
    const iIsin = header.indexOf("ISIN NUMBER");

    if (iSymbol < 0 || iName < 0) throw new Error("Unexpected CSV header: " + lines[0]);

    const rows = lines
        .slice(1)
        .map(parseLine)
        .filter((r) => r[iSymbol] && (iSeries < 0 || r[iSeries] === "EQ")) // regular equity only
        .map((r) => ({
            symbol: r[iSymbol].toUpperCase(),
            name: r[iName],
            isin: iIsin >= 0 && r[iIsin] ? r[iIsin] : null,
        }));

    let done = 0;
    for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        await prisma.$transaction(
            chunk.map((s) =>
                prisma.stock.upsert({
                    where: { symbol: s.symbol },
                    create: { ...s, isActive: true },
                    update: { name: s.name, isin: s.isin, isActive: true },
                })
            )
        );
        done += chunk.length;
    }
    console.log(`Imported ${done} stocks`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());