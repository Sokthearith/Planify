import { Router } from "express";
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

router.route("/").post(createGroup).get(getMyGroups);
router.route("/:id").get(getMyGroupsById).put(updateGroup).delete(deleteGroup);
router.route("/:id/members", addMember);
router.route("/:id/members/:memberId", removeMember);

export default router;
