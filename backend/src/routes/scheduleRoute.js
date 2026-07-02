import { Router } from "express";
import {
  createSchedule,
  deleteSchedule,
  getMySchedules,
  getScheduleById,
  updateSchedule,
} from "../controllers/scheduleController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.route("/").post(createSchedule).get(getMySchedules);
router.route("/:id").get(getScheduleById).put(updateSchedule).delete(deleteSchedule);

export default router;
