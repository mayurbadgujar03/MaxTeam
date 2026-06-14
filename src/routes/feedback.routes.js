import { Router } from "express";
import { createFeedback } from "../controllers/feedback.controllers.js";

const router = Router();

router.post("/", createFeedback);

export default router;
