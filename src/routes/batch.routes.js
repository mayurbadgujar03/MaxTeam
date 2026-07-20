import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { createBatch, getWorkspaceBatches, getPublicBatchDetails } from "../controllers/batch.controllers.js";

const router = Router();

router
  .route("/")
  .post(isLoggedIn, createBatch)
  .get(isLoggedIn, getWorkspaceBatches);

router.route("/public/:batchId").get(getPublicBatchDetails);

export default router;
