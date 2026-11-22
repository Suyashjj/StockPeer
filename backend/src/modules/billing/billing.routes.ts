import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as billing from "./billing.controller";

const router = Router();
router.use(requireAuth);

router.get("/plans", billing.plans);
router.post("/checkout", billing.checkout);
router.post("/verify", billing.verify);

export default router;