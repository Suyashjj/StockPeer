export type HeatStock = {
    name: string;
    company: string;
    sector: string;
    size: number; // market weight (sample)
    change: number; // day change in %
};

export type HeatSector = {
    name: string;
    children: HeatStock[];
};

type RawStock = Omit<HeatStock, "sector">;

const raw: Record<string, RawStock[]> = {
    Banking: [
        { name: "HDFCBANK", company: "HDFC Bank", size: 13, change: -0.35 },
        { name: "ICICIBANK", company: "ICICI Bank", size: 9, change: 1.1 },
        { name: "SBIN", company: "State Bank of India", size: 5, change: 2.3 },
        { name: "KOTAKBANK", company: "Kotak Mahindra Bank", size: 4, change: -1.2 },
    ],
    IT: [
        { name: "TCS", company: "Tata Consultancy Services", size: 11, change: -0.68 },
        { name: "INFY", company: "Infosys", size: 7, change: 0.92 },
        { name: "HCLTECH", company: "HCL Technologies", size: 4, change: 1.6 },
        { name: "WIPRO", company: "Wipro", size: 3, change: -2.1 },
    ],
    Energy: [
        { name: "RELIANCE", company: "Reliance Industries", size: 12, change: 1.24 },
        { name: "ONGC", company: "Oil & Natural Gas Corp", size: 3, change: 0.4 },
        { name: "NTPC", company: "NTPC Ltd", size: 3, change: -0.5 },
    ],
    Auto: [
        { name: "M&M", company: "Mahindra & Mahindra", size: 4, change: 2.8 },
        { name: "MARUTI", company: "Maruti Suzuki", size: 4, change: -0.9 },
    ],
    FMCG: [
        { name: "ITC", company: "ITC Ltd", size: 5, change: 0.3 },
        { name: "HINDUNILVR", company: "Hindustan Unilever", size: 4, change: -1.5 },
    ],
};

export const heatmapData: HeatSector[] = Object.entries(raw).map(([sector, stocks]) => ({
    name: sector,
    children: stocks.map((s) => ({ ...s, sector })),
}));