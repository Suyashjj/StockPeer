import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { upload } from "../../middleware/upload";
import * as support from "./support.controller";

const router = Router();
router.use(requireAuth, (req, res, next) =>
    (req as { user?: { role: string } }).user?.role === "ADMIN"
        ? res.status(403).json({ message: "Use the admin panel" })
        : next()
);

router.get("/", support.list);
router.post("/", upload.single("document"), support.create);

export default router;