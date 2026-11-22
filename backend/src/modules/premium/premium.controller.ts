import { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { AuthedRequest } from "../../middleware/auth";
import { isPanVerified } from "../stocks/stocks.service";
import * as premium from "./premium.service";

export const status = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const s = await premium.premiumStatus(req.user!.id, req.params.symbol as string);
    if (!s) return res.status(404).json({ message: "Stock not found" });
    res.json(s);
});

export const unlock = asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.user!.role !== "USER") return res.status(403).json({ message: "Members only" });

    const r = await premium.unlockGroup(req.user!.id, req.params.symbol as string);
    const map = {
        NO_EXPERT: [409, "This group has no expert yet"],
        NO_PLAN: [403, "You need an active Premium or Elite plan"],
        LIMIT: [409, "You have used all your premium group slots"],
    } as const;
    if (r in map) {
        const [code, message] = map[r as keyof typeof map];
        return res.status(code).json({ message });
    }
    res.status(r === "OK" ? 201 : 200).json({ ok: true });
});

export const requestExpert = asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.user!.role !== "USER") return res.status(403).json({ message: "Members only" });
    if (!(await isPanVerified(req.user!.id))) {
        return res.status(403).json({ message: "Verify your PAN first" });
    }
    const r = await premium.requestExpert(req.user!.id, req.params.symbol as string);
    if (r === "NOT_FOUND") return res.status(404).json({ message: "Stock not found" });
    if (r === "HAS_EXPERT") return res.status(409).json({ message: "This stock already has an expert" });
    res.status(201).json({ ok: true });
});