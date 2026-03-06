import { Router } from "express";
import upload from "../../middlewares/multer";

import {
  createServiceOrSubService,
  updateService,
  getServiceList,
  getAllServiceList,
  getServiceDetails,
  removeServiceImages,
  softDeleteService,
  restoreService,
  permanentlyDeleteService
} from "../../modules/service-types/service.controller";

const router = Router();

/**
 * =================================================
 * CREATE SERVICE
 * =================================================
 */
router.post(
  "/",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Create a new service"
    #swagger.autoBody = false
    #swagger.consumes = ["multipart/form-data"]

    #swagger.parameters['serviceId'] = { in: 'formData', required: false, type: 'string' }
    #swagger.parameters['title'] = { in: 'formData', required: true, type: 'string' }
    #swagger.parameters['subtitle'] = { in: 'formData', required: true, type: 'string' }
    #swagger.parameters['description'] = { in: 'formData', required: true, type: 'string' }
    #swagger.parameters['status'] = { in: 'formData', required: false, type: 'boolean' }
    #swagger.parameters['images'] = { in: 'formData', required: false, type: 'array', items: { type: 'file' } }
  */
  upload.array("images"),
  createServiceOrSubService
);

/**
 * =================================================
 * UPDATE SERVICE
 * =================================================
 */
router.put(
  "/:serviceId",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Update service details"
    #swagger.autoBody = false
    #swagger.consumes = ["multipart/form-data"]

    #swagger.parameters['serviceId'] = { in: 'path', required: true, type: 'string' }
    #swagger.parameters['title'] = { in: 'formData', required: false, type: 'string' }
    #swagger.parameters['subtitle'] = { in: 'formData', required: false, type: 'string' }
    #swagger.parameters['description'] = { in: 'formData', required: false, type: 'string' }
    #swagger.parameters['status'] = { in: 'formData', required: false, type: 'boolean' }
    #swagger.parameters['images'] = { in: 'formData', required: false, type: 'array', items: { type: 'file' } }
  */
  upload.array("images"),
  updateService
);

/**
 * =================================================
 * SERVICE IMAGE MANAGEMENT
 * =================================================
 */

/**
 * Remove service images
 */
router.delete(
  "/:serviceId/images",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Remove images from a service"

    #swagger.parameters['serviceId'] = { in: 'path', required: true, type: 'string' }

    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        images: [
          "https://res.cloudinary.com/demo/image/upload/services/sample.jpg"
        ]
      }
    }
  */
  removeServiceImages
);

/**
 * =================================================
 * FETCH SERVICES
 * =================================================
 */

/**
 * Get all services (admin)
 */
router.get(
  "/all",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Get all services"

    #swagger.parameters['includeDeleted'] = {
      in: 'query',
      required: false,
      type: 'boolean'
    }
  */
  getAllServiceList
);

/**
 * Get active service list (public)
 */
router.get(
  "/",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Get active service list"
  */
  getServiceList
);

/**
 * Get service details
 */
router.get(
  "/:serviceId",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Get service details"

    #swagger.parameters['serviceId'] = {
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
  getServiceDetails
);

/**
 * =================================================
 * SOFT DELETE / RESTORE
 * =================================================
 */

/**
 * Soft delete service
 */
router.patch(
  "/:serviceId/soft-delete",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Soft delete service"

    #swagger.parameters['serviceId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  softDeleteService
);

/**
 * Restore service
 */
router.patch(
  "/:serviceId/restore",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Restore soft deleted service"

    #swagger.parameters['serviceId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  restoreService
);

/**
 * =================================================
 * PERMANENT DELETE
 * =================================================
 */

router.delete(
  "/:serviceId/permanent",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Permanently delete service"

    #swagger.parameters['serviceId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  permanentlyDeleteService
);

export default router;