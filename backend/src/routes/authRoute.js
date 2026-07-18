import { Router } from "express";
import {
  forgotPassword,
  getPreferences,
  getMe,
  login,
  logout,
  register,
  resetPassword,
  updateMe,
  updatePreferences,
  verifyResetCode,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.route("/me").get(protect, getMe).patch(protect, updateMe);
router.route("/me/preferences").get(protect, getPreferences).patch(protect, updatePreferences);
router.post("/logout", protect, logout);

export default router;
