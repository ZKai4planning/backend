import { Router } from "express";
import upload from "../../middlewares/multer";

import {
  createServiceOrSubService,
  updateService,
  getServiceList,
  getAllServiceList,
  getServiceDetails,
  removeServiceImage,
  permanentlyDeleteService,
  softDeleteService,
  restoreService,
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
    #swagger.parameters['serviceName'] = { in: 'formData', required: true, type: 'string' }
    #swagger.parameters['description'] = { in: 'formData', required: true, type: 'string' }
    #swagger.parameters['status'] = { in: 'formData', required: false, type: 'boolean' }
    #swagger.parameters['image'] = { in: 'formData', required: false, type: 'file'}
  */
  upload.single("image"),
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
    #swagger.parameters['serviceName'] = { in: 'formData', required: false, type: 'string' }
    #swagger.parameters['description'] = { in: 'formData', required: false, type: 'string' }
    #swagger.parameters['status'] = { in: 'formData', required: false, type: 'boolean' }
    #swagger.parameters['image'] = { in: 'formData', required: false, type: 'file' }
  */
  upload.single("image"),
  updateService
);

/**
 * =================================================
 * SERVICE IMAGE MANAGEMENT
 * =================================================
 */

/**
 * Remove service image
 */
router.delete(
  "/:serviceId/image",
  /*
    #swagger.tags = ["Services"]
    #swagger.summary = "Remove image from a service"

    #swagger.parameters['serviceId'] = { in: 'path', required: true, type: 'string' }

    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        image:"https://res.cloudinary.com/demo/image/upload/services/sample.jpg"
      }
    }
  */
  removeServiceImage
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

    #swagger.parameters['includeDeleted'] = {
      in: 'query',
      required: false,
      type: 'boolean'
    }
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
