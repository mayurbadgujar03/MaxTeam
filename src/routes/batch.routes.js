import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  createBatch,
  getWorkspaceBatches,
  getPublicBatchDetails,
  updateBatchCoordinators,
  getBatchById,
  getBatchStats,
  exportBatchCSV
} from "../controllers/batch.controllers.js";

const router = Router();

router
  .route("/")
  .post(isLoggedIn, createBatch)
  .get(isLoggedIn, getWorkspaceBatches);

router.route("/public/:batchId").get(getPublicBatchDetails);
router.route("/:batchId").get(isLoggedIn, getBatchById);
router.route("/:batchId/stats").get(isLoggedIn, getBatchStats);
router.route("/:batchId/export").get(isLoggedIn, exportBatchCSV);
router.route("/:batchId/coordinators").patch(isLoggedIn, updateBatchCoordinators);

export default router;
