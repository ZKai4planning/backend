import { Router } from "express";

import {
  createSubService,
  updateSubService,
  deleteSubService,
  getSubServicesByService
} from "../../modules/service-types/subservice.controller";

import upload from "../../middlewares/multer";

const router = Router();

/**
 * CREATE SUBSERVICE
 */
router.post(
  "/",
  /*
    #swagger.autoBody = false
    #swagger.consumes = ["multipart/form-data"]
    #swagger.parameters["serviceId"] = { in: "formData", required: true, type: "string" }
    #swagger.parameters["name"] = { in: "formData", required: true, type: "string" }
    #swagger.parameters["description"] = { in: "formData", required: false, type: "string" }
    #swagger.parameters["status"] = { in: "formData", required: false, type: "boolean" }
    #swagger.parameters["images"] = { in: "formData", required: false, type: "array", items: { type: "file" } }
  */
  upload.array("images"),
  createSubService
);

/**
 * UPDATE SUBSERVICE
 */
router.put(
  "/:subServiceId",
  /*
    #swagger.autoBody = false
    #swagger.consumes = ["multipart/form-data"]
    #swagger.parameters["subServiceId"] = { in: "path", required: true, type: "string" }
    #swagger.parameters["name"] = { in: "formData", required: false, type: "string" }
    #swagger.parameters["description"] = { in: "formData", required: false, type: "string" }
    #swagger.parameters["status"] = { in: "formData", required: false, type: "boolean" }
    #swagger.parameters["images"] = { in: "formData", required: false, type: "array", items: { type: "file" } }
  */
  upload.array("images"),
  updateSubService
);

/**
 * DELETE SUBSERVICE
 */
router.delete(
  "/:subServiceId",
  deleteSubService
);

/**
 * GET SUBSERVICES BY SERVICE
 */
router.get(
  "/service/:serviceId",
  getSubServicesByService
);

export default router;
