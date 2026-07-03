import { Router } from "express";
import {
  createGroup,
  getMyGroups,
  getMyGroupsById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  getGroupTasks,
  createGroupTask,
  updateGroupTask,
  deleteGroupTask,
  getInvites,
  acceptInvite,
  rejectInvite,
} from "../controllers/groupController.js";
import { getMemberProgress } from "../controllers/groupTaskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/invites", getInvites);
router.route("/").post(createGroup).get(getMyGroups);
router.route("/:id").get(getMyGroupsById).put(updateGroup).delete(deleteGroup);
router.post("/:id/accept", acceptInvite);
router.post("/:id/reject", rejectInvite);
router.route("/:id/members/progress").get(getMemberProgress);
router.route("/:id/members").post(addMember);
router.route("/:id/members/:memberId").delete(removeMember);
router.route("/:id/tasks").get(getGroupTasks).post(createGroupTask);
router.route("/:id/tasks/:taskId").put(updateGroupTask).delete(deleteGroupTask);

export default router;
