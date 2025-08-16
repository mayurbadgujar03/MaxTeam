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

router
  .route("/:projectId")
  .get(isLoggedIn, validateProjectPermission(AvailableUserRoles), getNotes)
  .post(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    createNote,
  );

router
  .route("/:projectId/n/:noteId")
  .get(isLoggedIn, validateProjectPermission(AvailableUserRoles), getNoteById)
  .put(isLoggedIn, validateProjectPermission([UserRolesEnum.ADMIN]), updateNote)
  .delete(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteNote,
  );

export default router;
