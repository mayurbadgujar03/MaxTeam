import { Router } from "express";
import { getAdminStats, updateFeedbackStatus } from "../controllers/admin.controllers.js";
import { isLoggedIn, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/stats", isLoggedIn, isSuperAdmin, getAdminStats);
router.patch("/feedback/:feedbackId", isLoggedIn, isSuperAdmin, updateFeedbackStatus);

export default router;
