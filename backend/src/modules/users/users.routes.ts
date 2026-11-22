import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { upload } from "../../middleware/upload";
import * as usersController from "./users.controller";

const router = Router();

router.use(requireAuth);

router.get("/me", usersController.getMe);
router.patch("/me", usersController.updateMe);
router.post("/me/pan", upload.single("panDocument"), usersController.submitPan);
router.post("/me/photo", upload.single("photo"), usersController.uploadPhoto);

export default router;