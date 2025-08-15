import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendEmailVerification,
  forgotPasswordRequest,
  resetForgottenPassword,
  refreshAccessToken,
} from "../controllers/auth.controllers.js";
import isLoggedIn from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(isLoggedIn, logoutUser);
router.route("/verify-email/:token").post(verifyEmail);
router.route("/resendEmailVerification").post(resendEmailVerification);
router.route("/forgotPasswordRequest").post(forgotPasswordRequest);
router.route("/reset-password/:token").post(resetForgottenPassword);
router.route("/refreshAccessToken").post(refreshAccessToken);

export default router;
