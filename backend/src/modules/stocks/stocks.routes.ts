import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as stocksController from "./stocks.controller";
import * as chatController from "../chat/chat.controller";
import * as newsController from "../news/news.controller";
import * as premiumController from "../premium/premium.controller";
import * as aiController from "../ai/ai.controller";

const router = Router();

router.use(requireAuth);

router.get("/", stocksController.search);
router.get("/mine", stocksController.mine);
router.get("/:symbol", stocksController.detail);
router.post("/:symbol/join", stocksController.join);
router.delete("/:symbol/join", stocksController.leave);
router.get("/:symbol/messages", chatController.history);
router.post("/:symbol/read", chatController.markRead);
router.post("/:symbol/attachments", chatController.uploadAttachment);
router.get("/:symbol/files", chatController.files);
router.get("/:symbol/news", newsController.news);
router.get("/:symbol/premium", premiumController.status);
router.post("/:symbol/premium/unlock", premiumController.unlock);
router.post("/:symbol/expert-request", premiumController.requestExpert);
router.get("/:symbol/ai/summary", aiController.summary);
router.post("/:symbol/ai/ask", aiController.ask);

export default router;