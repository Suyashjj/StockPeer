import { Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { logEvent } from "../../lib/events";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../../middleware/auth";
import * as stocksService from "./stocks.service";
import { removeFromGroupRoom } from "../../socket";

const searchSchema = z.object({
    q: z.string().trim().max(60).optional(),
    sector: z.string().trim().max(40).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const search = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ message: "Invalid search" });
    const result = await stocksService.searchStocks(req.user!.id, parsed.data);
    return res.json(result);
});

export const detail = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const stock = await stocksService.getStock(req.user!.id, req.params.symbol as string);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    if (req.user!.role === "USER") logEvent(req.user!.id, req.params.symbol as string, "VIEW");
    return res.json({ stock });
});

export const join = asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.user!.role !== "USER") {
        return res.status(403).json({ message: "Only member accounts can join groups" });
    }

    if (!(await stocksService.isPanVerified(req.user!.id))) {
        const p = await prisma.userProfile.findUnique({
            where: { userId: req.user!.id },
            select: { panStatus: true },
        });
        return res.status(403).json({
            code: "PAN_REQUIRED",
            panStatus: p?.panStatus ?? "NOT_SUBMITTED",
            message: "Verify your PAN to join a group",
        });
    }

    const result = await stocksService.joinStock(req.user!.id, req.params.symbol as string);
    if (result === "NOT_FOUND") return res.status(404).json({ message: "Stock not found" });
    if (result === "JOINED") logEvent(req.user!.id, req.params.symbol as string, "JOIN");

    const stock = await stocksService.getStock(req.user!.id, req.params.symbol as string);
    return res.status(result === "JOINED" ? 201 : 200).json({ stock });
});

export const leave = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const symbol = req.params.symbol as string;
    const left = await stocksService.leaveStock(req.user!.id, symbol);
    if (left) logEvent(req.user!.id, symbol, "LEAVE");
    removeFromGroupRoom(req.user!.id, symbol);
    const stock = await stocksService.getStock(req.user!.id, symbol);
    return res.json({ stock });
});


export const mine = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const items = await stocksService.myStocks(req.user!.id);
    return res.json({ items });
});