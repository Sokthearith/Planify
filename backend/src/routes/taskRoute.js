import { Router } from "express";
import {
  createTask,
  deleteTask,
  getMyTasks,
  getTaskById,
  updateTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.route("/").post(createTask).get(getMyTasks);
router.route("/:id").get(getTaskById).put(updateTask).delete(deleteTask);

export default router;
