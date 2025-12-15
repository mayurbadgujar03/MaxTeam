import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notification.controllers.js";

const router = Router();

router.route("/").get(isLoggedIn, getNotifications);

router.route("/mark-all-read").patch(isLoggedIn, markAllAsRead);

router.route("/delete-all").delete(isLoggedIn, deleteAllNotifications);

router
  .route("/:notificationId")
  .patch(isLoggedIn, markAsRead)
  .delete(isLoggedIn, deleteNotification);

export default router;
