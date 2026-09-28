import { Router } from "express";
import {
  markMentorAttendance,
  getMilestoneAttendance,
  getBatchWeekAttendance,
  markBatchAttendance,
} from "../controllers/attendance.controllers.js";
import {
  isLoggedIn,
  validateProjectPermission,
  validateBatchAccess,
} from "../middlewares/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.use(isLoggedIn);

// Get attendance for a specific milestone (Allowed for everyone in the project)
router.route("/:projectId/milestones/:milestoneId").get(
  validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN, UserRolesEnum.MEMBER]),
  getMilestoneAttendance
);

// Mentor submits attendance (Allowed ONLY for Mentor/Admin)
router.route("/:projectId/milestones/:milestoneId/mentor").post(
  validateProjectPermission([UserRolesEnum.ADMIN]),
  markMentorAttendance
);

// Batch-level Attendance Routes
router.route("/batch/:batchId")
  .get(
    validateBatchAccess(['hod', 'coordinator']), 
    getBatchWeekAttendance
  )
  .post(
    validateBatchAccess(['hod', 'coordinator']), 
    markBatchAttendance
  );

export default router;
