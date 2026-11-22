import { api } from "@/lib/api";
import type { StockItem } from "./types";

export type JoinResult =
    | { ok: true; stock: StockItem }
    | { ok: false; panRequired: true; panStatus: string }
    | { ok: false; panRequired: false };

export async function setJoined(symbol: string, join: boolean): Promise<JoinResult> {
    const res = await api(`/stocks/${encodeURIComponent(symbol)}/join`, {
        method: join ? "POST" : "DELETE",
    });
    if (res.ok) return { ok: true, stock: res.data.stock as StockItem };
    if (res.status === 403 && res.data?.code === "PAN_REQUIRED") {
        return { ok: false, panRequired: true, panStatus: res.data.panStatus };
    }
    return { ok: false, panRequired: false };
}