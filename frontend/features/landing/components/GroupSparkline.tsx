"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

type Props = {
    data: number[];
    up: boolean;
};

export default function GroupSparkline({ data, up }: Props) {
    const points = data.map((price, i) => ({ i, price }));
    const color = up ? "#1e8e5a" : "#c0392b";

    return (
        <div className="h-12 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
                    <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}