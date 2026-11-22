import { Response, Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { AuthedRequest, requireAuth } from "../../middleware/auth";
import { getHome } from "./home.service";

const router = Router();
router.use(requireAuth);

router.get(
    "/",
    asyncHandler(async (req: AuthedRequest, res: Response) => {
        if (req.user!.role !== "USER") return res.status(403).json({ message: "Members only" });
        res.json(await getHome(req.user!.id));
    })
);

export default router;