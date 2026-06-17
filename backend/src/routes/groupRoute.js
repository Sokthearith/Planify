import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createGroup,
  getMyGroups,
  getMyGroupsById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
} from "../controllers/groupController.js";

const router = Router();

router.route("/").post(protect, createGroup).get(protect, getMyGroups);
router
  .route("/:id")
  .get(protect, getMyGroupsById)
  .put(protect, updateGroup)
  .delete(protect, deleteGroup);
router.route("/:id/members", protect, addMember);
router.route("/:id/members/:memberId", protect, removeMember);

export default router;
