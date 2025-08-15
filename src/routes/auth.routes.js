import { Router } from "express";
import { registerUser, loginUser, logoutUser, verifyEmail } from "../controllers/auth.controllers.js";
import isLoggedIn from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(isLoggedIn, logoutUser);
router.route("/verify-email/:token").post(verifyEmail);

export default router;