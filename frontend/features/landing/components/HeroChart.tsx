"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const chartData = [
    { t: "9:15", price: 2891 },
    { t: "9:45", price: 2903 },
    { t: "10:15", price: 2897 },
    { t: "10:45", price: 2915 },
    { t: "11:15", price: 2908 },
    { t: "11:45", price: 2924 },
    { t: "12:15", price: 2919 },
    { t: "12:45", price: 2931 },
    { t: "13:15", price: 2926 },
    { t: "13:45", price: 2938 },
    { t: "14:15", price: 2934 },
    { t: "14:45", price: 2945 },
];

const tickers = [
    { symbol: "TCS", change: "-0.68%", up: false },
    { symbol: "INFY", change: "+0.92%", up: true },
    { symbol: "HDFCBANK", change: "-0.35%", up: false },
];

export default function HeroChart() {
    return (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_30px_rgba(31,41,55,0.08)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-ink-soft">RELIANCE</p>
                    <p className="mt-1 font-mono text-3xl font-semibold text-ink">₹2,945.10</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-up/10 px-3 py-1 text-sm font-medium text-up">
                    <TrendingUp size={14} />
                    +1.24%
                </span>
            </div>

            <div className="mt-4 h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1e8e5a" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#1e8e5a" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                        <Tooltip
                            cursor={{ stroke: "#e3e1d9" }}
                            contentStyle={{
                                background: "#fbfaf7",
                                border: "1px solid #e3e1d9",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                            labelFormatter={(label) => `Today, ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#1e8e5a"
                            strokeWidth={2.5}
                            fill="url(#heroFade)"
                            dot={false}
                            activeDot={{ r: 4, fill: "#1e8e5a", stroke: "#fbfaf7", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                {tickers.map((t) => (
                    <div key={t.symbol} className="rounded-xl border border-line bg-paper px-3 py-2">
                        <p className="text-xs font-medium text-ink-soft">{t.symbol}</p>
                        <p
                            className={`mt-1 flex items-center gap-1 text-sm font-semibold ${t.up ? "text-up" : "text-down"
                                }`}
                        >
                            {t.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {t.change}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}