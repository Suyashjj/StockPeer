import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { requireEligibleExpert } from "../../middleware/expertOnly";
import { upload } from "../../middleware/upload";
import * as expertController from "./expert.controller";
import * as profile from "./expert.profile";
import * as work from "./expert.work";
import * as sessions from "../sessions/sessions.expert";

const router = Router();

// Any expert, even a pending one
router.get("/me", requireAuth, expertController.myApplication);
router.get("/profile", requireAuth, requireRole("EXPERT"), profile.get);
router.patch("/profile", requireAuth, requireRole("EXPERT"), profile.update);
router.post("/profile/photo", requireAuth, requireRole("EXPERT"), upload.single("photo"), profile.photo);

// Everything below needs an approved SEBI RA / IA expert
router.use(requireAuth, requireEligibleExpert);
router.get("/opportunities", work.opportunities);
router.post("/requests", work.apply);
router.get("/requests", work.myRequests);
router.get("/groups", work.myGroups);
router.get("/sessions", sessions.mySessions);
router.post("/sessions/:id/complete", sessions.completeSession);

export default router;