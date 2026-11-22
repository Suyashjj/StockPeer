"use client";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { heatmapData } from "../data/heatmap";

/* ---------- helpers ---------- */

function mix(a: [number, number, number], b: [number, number, number], t: number) {
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const GAIN_LIGHT: [number, number, number] = [207, 232, 218];
const GAIN_DEEP: [number, number, number] = [30, 142, 90];
const LOSS_LIGHT: [number, number, number] = [241, 208, 203];
const LOSS_DEEP: [number, number, number] = [176, 58, 46];

function intensity(change: number) {
    return Math.min(Math.abs(change) / 3, 1);
}

function tileColor(change: number) {
    const t = intensity(change);
    return change >= 0 ? mix(GAIN_LIGHT, GAIN_DEEP, t) : mix(LOSS_LIGHT, LOSS_DEEP, t);
}

function formatChange(change: number) {
    return `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
}

/* ---------- summary numbers ---------- */

const allStocks = heatmapData.flatMap((s) => s.children);
const advancing = allStocks.filter((s) => s.change > 0).length;
const declining = allStocks.filter((s) => s.change < 0).length;

function weightedAvg(stocks: typeof allStocks) {
    const total = stocks.reduce((sum, s) => sum + s.size, 0);
    return stocks.reduce((sum, s) => sum + s.change * s.size, 0) / total;
}

const marketAvg = weightedAvg(allStocks);
const sectorStats = heatmapData.map((s) => ({
    name: s.name,
    avg: weightedAvg(s.children),
}));

/* ---------- treemap tile ---------- */

type TileProps = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    depth?: number;
    name?: string;
    change?: number;
};

function HeatTile({ x = 0, y = 0, width = 0, height = 0, depth, name, change }: TileProps) {
    if (depth !== 2 || change === undefined) return null;

    const strong = intensity(change) > 0.45;
    const textColor = strong ? "#ffffff" : "#1f2937";
    const showName = width > 52 && height > 30;
    const showChange = width > 52 && height > 50;
    const fontSize = width > 120 ? 14 : 11;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={4}
                fill={tileColor(change)}
                stroke="#f5f4ef"
                strokeWidth={3}
            />
            {showName && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 - (showChange ? 4 : -4)}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={fontSize}
                    fontWeight={700}
                >
                    {name}
                </text>
            )}
            {showChange && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 14}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={fontSize - 1}
                    opacity={0.9}
                >
                    {formatChange(change)}
                </text>
            )}
        </g>
    );
}

/* ---------- tooltip ---------- */

type TipProps = {
    active?: boolean;
    payload?: { payload?: Record<string, unknown> }[];
};

function HeatTooltip({ active, payload }: TipProps) {
    const node = payload?.[0]?.payload;
    if (!active || !node || typeof node.change !== "number") return null;

    const change = node.change;
    return (
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md">
            <p className="text-sm font-semibold text-ink">{String(node.name)}</p>
            <p className="text-ink-soft">{String(node.company)}</p>
            <p className="mt-1 text-ink-soft">Sector: {String(node.sector)}</p>
            <p className={`mt-1 font-semibold ${change >= 0 ? "text-up" : "text-down"}`}>
                {formatChange(change)}
            </p>
        </div>
    );
}

/* ---------- section ---------- */

export default function MarketHeatmap() {
    return (
        <section className="mx-auto max-w-6xl px-6 pb-24">
            <div className="mb-8 max-w-2xl">
                <span className="text-sm font-semibold tracking-wide text-brand uppercase">
                    Market pulse
                </span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
                    See the market at a glance
                </h2>
                <p className="mt-3 text-ink-soft">
                    Every tile is a stock. Bigger tiles carry more weight, greener means rising,
                    redder means falling. Find the conversation where the action is.
                </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 shadow-[0_8px_30px_rgba(31,41,55,0.06)] sm:p-6">
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-up/10 px-4 py-3">
                        <p className="text-xs font-medium text-ink-soft">Advancing</p>
                        <p className="mt-1 text-xl font-semibold text-up">{advancing}</p>
                    </div>
                    <div className="rounded-xl bg-down/10 px-4 py-3">
                        <p className="text-xs font-medium text-ink-soft">Declining</p>
                        <p className="mt-1 text-xl font-semibold text-down">{declining}</p>
                    </div>
                    <div className="rounded-xl bg-brand/10 px-4 py-3">
                        <p className="text-xs font-medium text-ink-soft">Market mood</p>
                        <p
                            className={`mt-1 text-xl font-semibold ${marketAvg >= 0 ? "text-up" : "text-down"
                                }`}
                        >
                            {formatChange(marketAvg)}
                        </p>
                    </div>
                </div>

                <div className="mt-5 h-[360px] w-full sm:h-[440px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={heatmapData}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            isAnimationActive={false}
                            content={<HeatTile />}
                        >
                            <Tooltip content={<HeatTooltip />} />
                        </Treemap>
                    </ResponsiveContainer>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs font-medium text-ink-soft">Sectors:</span>
                    {sectorStats.map((s) => (
                        <span
                            key={s.name}
                            className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-ink"
                        >
                            {s.name}{" "}
                            <span className={s.avg >= 0 ? "text-up" : "text-down"}>
                                {formatChange(s.avg)}
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}