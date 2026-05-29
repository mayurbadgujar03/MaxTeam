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
  updateMemberGithub,
  updateMemberRole,
  updateProject,
} from "../controllers/project.controllers.js";
import { getProjectCommits } from "../controllers/codetrack.controllers.js";

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
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
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
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    addMemberToProject,
  );

router
  .route("/:projectId/members/:memberId")
  .put(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    updateMemberRole,
  )
  .patch(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
    updateMemberGithub,
  )
  .delete(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteMember,
  );

// Code Track — admin (Mentor) only; secondary guard is inside the controller
router
  .route("/:projectId/commits")
  .get(
    isLoggedIn,
    validateProjectPermission(AvailableUserRoles), // at minimum must be a member
    getProjectCommits,                             // controller enforces admin-only
  );

export default router;
