import { Router } from "express";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import {
  validateProjectPermission,
  isLoggedIn,
} from "../middlewares/auth.middleware.js";
import {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/note.controllers.js";

const router = Router();

// All three roles can read notes
// POST: all roles can create — ownership tracked via createdBy in controller
const allRoles = AvailableUserRoles; // ["admin", "project_admin", "member"]

// Mutating operations: route middleware lets all authenticated members through;
// the controller enforces the MEMBER-can-only-touch-own-note rule.
const mutatorRoles = [
  UserRolesEnum.ADMIN,
  UserRolesEnum.PROJECT_ADMIN,
  UserRolesEnum.MEMBER,
];

router
  .route("/:projectId")
  .get(isLoggedIn, validateProjectPermission(allRoles), getNotes)
  .post(isLoggedIn, validateProjectPermission(mutatorRoles), createNote);

router
  .route("/:projectId/n/:noteId")
  .get(isLoggedIn, validateProjectPermission(allRoles), getNoteById)
  .put(isLoggedIn, validateProjectPermission(mutatorRoles), updateNote)
  .delete(isLoggedIn, validateProjectPermission(mutatorRoles), deleteNote);

export default router;
