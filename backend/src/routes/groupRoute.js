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
router.route("/:id/members").post(addMember);
router.route("/:id/members/:memberId").delete(removeMember);

export default router;
