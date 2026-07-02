import { Router } from "express";
import {
  createGroup,
  getMyGroups,
  getMyGroupsById,
  updateGroup,
  deleteGroup,
  addMember,
  createGroupTask,
  deleteGroupTask,
  getGroupTasks,
  removeMember,
  updateGroupTask,
} from "../controllers/groupController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.route("/").post(createGroup).get(getMyGroups);
router.route("/:id").get(getMyGroupsById).put(updateGroup).delete(deleteGroup);
router.route("/:id/members").post(addMember);
router.route("/:id/members/:memberId").delete(removeMember);
router.route("/:id/tasks").get(getGroupTasks).post(createGroupTask);
router.route("/:id/tasks/:taskId").put(updateGroupTask).delete(deleteGroupTask);

export default router;
