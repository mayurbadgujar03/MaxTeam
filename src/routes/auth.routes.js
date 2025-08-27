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
  changeCurrentPassword,
  getCurrentUser,
} from "../controllers/auth.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(isLoggedIn, logoutUser);

router.route("/verify-email/:token").post(verifyEmail);
router.route("/resend-email-verification").post(resendEmailVerification);

router.route("/forgot-password-request").post(forgotPasswordRequest);
router.route("/reset-password/:token").post(resetForgottenPassword);

router.route("/refresh-access-token").post(refreshAccessToken);

router.route("/change-current-password").put(isLoggedIn, changeCurrentPassword);
router.route("/current-user").get(isLoggedIn, getCurrentUser);

export default router;
