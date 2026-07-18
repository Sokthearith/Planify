import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  cancelFocusSession,
  getCurrentFocusSession,
  startFocusSession,
  updateFocusSession,
} from "../controllers/focusSessionController.js";

const router = Router();
router.use(protect);
router.get("/current", getCurrentFocusSession);
router.post("/", startFocusSession);
router.patch("/:id", updateFocusSession);
router.delete("/:id", cancelFocusSession);

export default router;
