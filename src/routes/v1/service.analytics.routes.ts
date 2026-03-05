import { Router } from "express";

import {
  serviceAnalytics,
  serviceBreakdown,
  topServices
} from "../../modules/service-types/service.analytics.controller";

const router = Router();

/**
 * SERVICES ANALYTICS
 */
router.get(
  "/services",
  serviceAnalytics
);

/**
 * SERVICE BREAKDOWN
 */
router.get(
  "/service-breakdown",
  serviceBreakdown
);

/**
 * TOP SERVICES
 */
router.get(
  "/top-services",
  topServices
);

export default router;