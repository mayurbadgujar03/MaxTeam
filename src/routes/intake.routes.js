import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { processBatchIntake } from "../controllers/intake.controllers.js";

const router = Router();

router.route("/").post(isLoggedIn, processBatchIntake);

export default router;
