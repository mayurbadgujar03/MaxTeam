import { Router } from "express";
import {
  isLoggedIn,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
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
  createTask,
);

router
  .route("/:projectId/n/:taskId")
  .get(isLoggedIn, getTaskById)
  .put(
    isLoggedIn,
    validateProjectPermission(AvailableUserRoles),
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
