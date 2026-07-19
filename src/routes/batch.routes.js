import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { createBatch, getWorkspaceBatches } from "../controllers/batch.controllers.js";

const router = Router();

router
  .route("/")
  .post(isLoggedIn, createBatch)
  .get(isLoggedIn, getWorkspaceBatches);

export default router;
