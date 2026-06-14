import { Router } from "express";
import { getPublicStats } from "../controllers/feedback.controllers.js";

const router = Router();

router.get("/stats", getPublicStats);

export default router;
