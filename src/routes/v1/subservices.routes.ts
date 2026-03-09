import { Router } from "express";
import upload from "../../middlewares/multer";

import {
  createSubService,
  updateSubService,
  getSubServiceDetails,
  getSubServicesByService,
  removeSubServiceImage,
  softDeleteSubService,
  restoreSubService,
  permanentlyDeleteSubService,
} from "../../modules/service-types/subservice.controller";

const router = Router();

/**
 * =================================================
 * CREATE SUBSERVICE
 * =================================================
 */
router.post(
  "/",
  /*
    #swagger.tags = ["SubServices"]
    #swagger.summary = "Create a new SubService"
    #swagger.autoBody = false
    #swagger.consumes = ["multipart/form-data"]

    #swagger.parameters['serviceId'] = { in: 'formData', required: true, type: 'string' }
    #swagger.parameters['title'] = { in: 'formData', required: true, type: 'string' }
    #swagger.parameters['subServiceName'] = { in: 'formData', required: true, type: 'string' }
    #swagger.parameters['description'] = { in: 'formData', required: true, type: 'string' }
    #swagger.parameters['status'] = { in: 'formData', required: false, type: 'boolean' }
    #swagger.parameters['image'] = { in: 'formData', required: false, type: 'file' }
  */
  upload.single("image"),
  createSubService
);

/**
 * =================================================
 * UPDATE SUBSERVICE
 * =================================================
 */
router.put(
  "/:subServiceId",
  /*
    #swagger.tags = ["SubServices"]
    #swagger.summary = "Update SubService details"
    #swagger.autoBody = false
    #swagger.consumes = ["multipart/form-data"]

    #swagger.parameters['subServiceId'] = { in: 'path', required: true, type: 'string' }

    #swagger.parameters['title'] = { in: 'formData', required: false, type: 'string' }
    #swagger.parameters['subServiceName'] = { in: 'formData', required: false, type: 'string' }
    #swagger.parameters['description'] = { in: 'formData', required: false, type: 'string' }
    #swagger.parameters['status'] = { in: 'formData', required: false, type: 'boolean' }
    #swagger.parameters['image'] = { in: 'formData', required: false, type: 'file' }
  */
  upload.single("image"),
  updateSubService
);

/**
 * =================================================
 * IMAGE MANAGEMENT
 * =================================================
 */

/**
 * Remove image from SubService
 */
router.delete(
  "/:subServiceId/image",
  /*
    #swagger.tags = ["SubServices"]
    #swagger.summary = "Remove image from a SubService"

    #swagger.parameters['subServiceId'] = { in: 'path', required: true, type: 'string' }

    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        image:"https://res.cloudinary.com/demo/image/upload/subservices/sample.jpg"
      }
    }
  */
  removeSubServiceImage
);

/**
 * =================================================
 * FETCH SUBSERVICES
 * =================================================
 */

/**
 * Get all SubServices belonging to a Service
 */
router.get(
  "/service/:serviceId",
  /*
    #swagger.tags = ["SubServices"]
    #swagger.summary = "Get SubServices by Service"

    #swagger.parameters['serviceId'] = { in: 'path', required: true, type: 'string' }

    #swagger.parameters['includeDeleted'] = {
      in: 'query',
      required: false,
      type: 'boolean'
    }
  */
  getSubServicesByService
);

/**
 * Get SubService details
 */
router.get(
  "/:subServiceId",
  /*
    #swagger.tags = ["SubServices"]
    #swagger.summary = "Get SubService details"

    #swagger.parameters['subServiceId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }

    #swagger.parameters['includeDeleted'] = {
      in: 'query',
      required: false,
      type: 'boolean'
    }
  */
  getSubServiceDetails
);

/**
 * =================================================
 * SOFT DELETE / RESTORE
 * =================================================
 */

/**
 * Soft delete SubService
 */
router.patch(
  "/:subServiceId/soft-delete",
  /*
    #swagger.tags = ["SubServices"]
    #swagger.summary = "Soft delete SubService"

    #swagger.parameters['subServiceId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  softDeleteSubService
);

/**
 * Restore SubService
 */
router.patch(
  "/:subServiceId/restore",
  /*
    #swagger.tags = ["SubServices"]
    #swagger.summary = "Restore soft deleted SubService"

    #swagger.parameters['subServiceId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  restoreSubService
);

/**
 * =================================================
 * PERMANENT DELETE
 * =================================================
 */

router.delete(
  "/:subServiceId/permanent",
  /*
    #swagger.tags = ["SubServices"]
    #swagger.summary = "Permanently delete SubService"

    #swagger.parameters['subServiceId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  permanentlyDeleteSubService
);

export default router;
