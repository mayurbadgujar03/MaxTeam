import { Router } from "express";
import { isLoggedIn, validateBatchAccess } from "../middlewares/auth.middleware.js";
import {
  createBatch,
  getWorkspaceBatches,
  getPublicBatchDetails,
  updateBatchCoordinators,
  getBatchById,
  getBatchStats,
  exportBatchCSV,
  updateCoordinatorWindow
} from "../controllers/batch.controllers.js";

const router = Router();

router
  .route("/")
  .post(isLoggedIn, createBatch)
  .get(isLoggedIn, getWorkspaceBatches);

router.route("/public/:batchId").get(getPublicBatchDetails);
router.route("/:batchId").get(isLoggedIn, validateBatchAccess(['hod', 'coordinator']), getBatchById);
router.route("/:batchId/stats").get(isLoggedIn, validateBatchAccess(['hod', 'coordinator']), getBatchStats);
router.route("/:batchId/export").get(isLoggedIn, validateBatchAccess(['hod', 'coordinator']), exportBatchCSV);
router.route("/:batchId/coordinators").patch(isLoggedIn, validateBatchAccess(['hod']), updateBatchCoordinators);
router.route("/:batchId/window").patch(isLoggedIn, validateBatchAccess(['hod', 'coordinator']), updateCoordinatorWindow);

export default router;
