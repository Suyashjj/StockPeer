import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { authLimiter, resetLimiter } from "../../middleware/rateLimit";
import { upload } from "../../middleware/upload";
import * as authController from "./auth.controller";
import * as expertController from "../expert/expert.controller";

const router = Router();

router.post("/signup", authLimiter, authController.signup);
router.post(
    "/signup/expert",
    authLimiter,
    upload.fields([
        { name: "photo", maxCount: 1 },
        { name: "idDocument", maxCount: 1 },
        { name: "proofDocument", maxCount: 1 },
    ]),
    expertController.signupExpert
);
router.post("/login", authLimiter, authController.login);
router.post("/forgot-password", resetLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);
router.get("/me", requireAuth, authController.me);
router.post("/logout", authController.logout);

export default router;