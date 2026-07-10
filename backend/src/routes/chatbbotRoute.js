import { Router } from "express";
import { chatbox } from "../controllers/chatbotController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.route("/").post(chatbox);

export default router;
