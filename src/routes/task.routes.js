import { Router } from "express";
import {
  isLoggedIn,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
} from "../controllers/task.controllers.js";

const router = Router();

router.get(
  "/projects/:projectId/tasks",
  isLoggedIn,
  validateProjectPermission(AvailableUserRoles),
  getTasks,
);

router.post(
  "/projects/:projectId/tasks",
  isLoggedIn,
  validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  upload.array("attachments", 5),
  createTask,
);

router
  .route("/:projectId/n/:taskId")
  .get(isLoggedIn, getTaskById)
  .put(
    isLoggedIn,
    validateProjectPermission(AvailableUserRoles),
    upload.array("attachments", 5),
    updateTask,
  )
  .delete(
    isLoggedIn,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    deleteTask,
  );

router.post(
  "/:projectId/n/:taskId/subtasks",
  isLoggedIn,
  validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
  createSubTask,
);

router
  .route("/:projectId/n/:taskId/subtasks/:subtaskId")
  .put(
    isLoggedIn,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    updateSubTask,
  )
  .delete(
    isLoggedIn,
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    deleteSubTask,
  );

export default router;
