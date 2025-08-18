import { Router } from "express";
import {
  isLoggedIn,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
} from "../controllers/project.controllers.js";

const router = Router();

router.route("/").get(isLoggedIn, getProjects).post(isLoggedIn, createProject);

router
  .route("/:projectId")
  .get(
    isLoggedIn,
    validateProjectPermission(AvailableUserRoles),
    getProjectById,
  )
  .put(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    updateProject,
  )
  .delete(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteProject,
  );

router
  .route("/:projectId/members")
  .get(
    isLoggedIn,
    validateProjectPermission(AvailableUserRoles),
    getProjectMembers,
  )
  .post(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    addMemberToProject,
  );

router
  .route("/:projectId/members/:memberId")
  .put(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    updateMemberRole,
  )
  .delete(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteMember,
  );

export default router;
