import { Router } from "express";
import {
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  googleLogin,
  googleCallback,
} from "../controllers/auth.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

// Google OAuth routes
router.route("/google").get(googleLogin);
router.route("/google/callback").get(googleCallback);

router.route("/logout").post(isLoggedIn, logoutUser);
router.route("/refresh-access-token").post(refreshAccessToken);
router.route("/current-user").get(isLoggedIn, getCurrentUser);

export default router;
