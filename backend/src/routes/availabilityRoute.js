import { Router } from "express";
import {
  getMyAvailability,
  setAvailability,
  deleteAvailability,
} from "../controllers/availabilityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getMyAvailability);
router.put("/", setAvailability);
router.delete("/", deleteAvailability);

export default router;
