import { Router } from "express";
import {
  acceptGroupInvite,
  createNotification,
  declineGroupInvite,
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.route("/").post(createNotification).get(getMyNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/accept", acceptGroupInvite);
router.patch("/:id/decline", declineGroupInvite);
router.route("/:id").delete(deleteNotification);
router.patch("/:id/read", markNotificationRead);

export default router;
