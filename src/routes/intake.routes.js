import { Router } from "express";
import { processBatchIntake } from "../controllers/intake.controllers.js";

const router = Router();

router.route("/").post(processBatchIntake);

export default router;
