import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { getDashboardStats } from "../controllers/dashboard.controllers.js";

const router = Router();

router.get("/stats", isLoggedIn, getDashboardStats);

export default router;
