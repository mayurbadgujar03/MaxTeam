import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { addDocumentComment, getDocumentComments } from "../controllers/comment.controllers.js";

const router = Router();

router.route("/").post(isLoggedIn, addDocumentComment);
router.route("/:documentId").get(isLoggedIn, getDocumentComments);

export default router;
