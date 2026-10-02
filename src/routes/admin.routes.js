import { Router } from "express";
import {
  getAdminStats,
  updateFeedbackStatus,
  createInstituteWorkspace,
  getInstituteWorkspaces,
} from "../controllers/admin.controllers.js";
import { isLoggedIn, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/stats", isLoggedIn, isSuperAdmin, getAdminStats);
router.patch("/feedback/:feedbackId", isLoggedIn, isSuperAdmin, updateFeedbackStatus);

// Institute Workspaces (Super Admin)
router.post("/workspaces", isLoggedIn, isSuperAdmin, createInstituteWorkspace);
router.get("/workspaces", isLoggedIn, isSuperAdmin, getInstituteWorkspaces);

export default router;

