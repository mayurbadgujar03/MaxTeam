import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { getMyWorkspaces } from "../controllers/workspace.controllers.js";

const router = Router();

router.route("/mine").get(isLoggedIn, getMyWorkspaces);

export default router;
