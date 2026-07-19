import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { getMyWorkspaces, addWorkspaceHod } from "../controllers/workspace.controllers.js";

const router = Router();

router.route("/mine").get(isLoggedIn, getMyWorkspaces);
router.route("/:workspaceId/hods").patch(isLoggedIn, addWorkspaceHod);

export default router;
