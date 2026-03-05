import { Router } from "express";
import {
  createService,
  updateService,
  getServiceList,
  getServiceDetails,
  getAllServiceList,
  removeServiceImages
} from "../../modules/service-types/service.controller";

import upload from "../../middlewares/multer";

const router = Router();

/**
 * CREATE SERVICE
 */
router.post(
  "/",
  /*
    #swagger.autoBody = false
    #swagger.consumes = ["multipart/form-data"]
    #swagger.parameters["name"] = { in: "formData", required: true, type: "string" }
    #swagger.parameters["description"] = { in: "formData", required: false, type: "string" }
    #swagger.parameters["images"] = { in: "formData", required: false, type: "array", items: { type: "file" } }
  */
  upload.array("images"),
  createService
);

/**
 * UPDATE SERVICE
 */
router.put(
  "/:serviceId",
  /*
    #swagger.autoBody = false
    #swagger.consumes = ["multipart/form-data"]
    #swagger.parameters["serviceId"] = { in: "path", required: true, type: "string" }
    #swagger.parameters["name"] = { in: "formData", required: false, type: "string" }
    #swagger.parameters["description"] = { in: "formData", required: false, type: "string" }
    #swagger.parameters["images"] = { in: "formData", required: false, type: "array", items: { type: "file" } }
  */
  upload.array("images"),
  updateService
);

/**
 * GET SERVICES (Dropdown list)
 */
router.get(
  "/",
  getServiceList
);

/**
 * GET ALL SERVICES (Full details)
 */
router.get(
  "/all",
  getAllServiceList
);

/**
 * GET SERVICE DETAILS
 */
router.get(
  "/:serviceId",
  getServiceDetails
);

/**
 * REMOVE SERVICE IMAGES
 */
router.delete(
  "/:serviceId/images",
  removeServiceImages
);

export default router;
