import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createGroup,
  getMyGroup,
  getGroupId,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
} from "../controllers/groupController.js";

const router = Router();

router.route("/").post(protect, createGroup).get(protect, getMyGroup);
router
  .route("/:id")
  .get(protect, getGroupId)
  .put(protect, updateGroup)
  .delete(protect, deleteGroup);
router.route("/:id/members", protect, addMember);
router.route("/:id/members/:memberId", protect, removeMember);

export default router;
