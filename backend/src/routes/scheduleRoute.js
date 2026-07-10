import { Router } from "express";
import {
  createSchedule,
  deleteSchedule,
  getMySchedules,
  getActiveSchedule,
  getScheduleById,
  updateSchedule,
  generateScheduleFromText,
  autoGenerateSchedule,
} from "../controllers/scheduleController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.route("/").post(createSchedule).get(getMySchedules);
router.route("/active").get(getActiveSchedule);
router
  .route("/:id")
  .get(getScheduleById)
  .put(updateSchedule)
  .delete(deleteSchedule);
router.route("/generate").post(generateScheduleFromText);
router.route("/auto-generate").post(autoGenerateSchedule);

export default router;
