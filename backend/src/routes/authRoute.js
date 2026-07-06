import { Router } from "express";
import {
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
  verifyResetCode,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

export default router;
