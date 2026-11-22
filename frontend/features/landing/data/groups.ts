export type Group = {
    symbol: string;
    name: string;
    price: string;
    change: string;
    up: boolean;
    members: string;
    trend: number[];
};

export const popularGroups: Group[] = [
    {
        symbol: "RELIANCE",
        name: "Reliance Industries",
        price: "2,945.10",
        change: "+1.24%",
        up: true,
        members: "12.4k",
        trend: [2891, 2903, 2897, 2915, 2908, 2924, 2931, 2938, 2945],
    },
    {
        symbol: "TCS",
        name: "Tata Consultancy Services",
        price: "3,812.55",
        change: "-0.68%",
        up: false,
        members: "9.1k",
        trend: [3851, 3846, 3849, 3838, 3841, 3829, 3825, 3818, 3812],
    },
    {
        symbol: "INFY",
        name: "Infosys",
        price: "1,590.30",
        change: "+0.92%",
        up: true,
        members: "7.8k",
        trend: [1572, 1575, 1573, 1579, 1577, 1583, 1586, 1588, 1590],
    },
    {
        symbol: "HDFCBANK",
        name: "HDFC Bank",
        price: "1,675.20",
        change: "-0.35%",
        up: false,
        members: "6.3k",
        trend: [1681, 1683, 1680, 1682, 1678, 1679, 1677, 1676, 1675],
    },
];