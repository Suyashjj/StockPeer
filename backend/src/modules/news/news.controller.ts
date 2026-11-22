import { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { AuthedRequest } from "../../middleware/auth";
import { getMembershipGroupId, getChannelGroupId } from "../chat/chat.service";
import * as newsService from "./news.service";

export const news = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const symbol = req.params.symbol as string;

    const groupId =
        (await getMembershipGroupId(req.user!.id, symbol)) ??
        (await getChannelGroupId(req.user!.id, symbol, "premium"));
    if (!groupId) return res.status(403).json({ message: "Join this group to see its news" });

    try {
        const result = await newsService.getNews(symbol);
        if (!result) return res.status(404).json({ message: "Stock not found" });
        return res.json(result);
    } catch {
        return res.status(502).json({ message: "News is unavailable right now. Try again later." });
    }
});