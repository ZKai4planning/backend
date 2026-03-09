import express from "express";
import {
    createConfiguration,
    getConfiguration,
    updateConfiguration,
} from "../../modules/admin-configuration/config.controller";
import upload from "../../middlewares/multer";

const router = express.Router();


/**
 * Create configuration (only if none exists)
 */
router.post(
    "/",
    /*
      #swagger.tags = ["Admin Configuration"]
      #swagger.summary = "Create system configuration"
      #swagger.description = "Creates initial configuration including default password and logo."
  
      #swagger.autoBody = false
      #swagger.consumes = ["multipart/form-data"]
  
      #swagger.parameters['defaultPassword'] = {
        in: 'formData',
        required: true,
        type: 'string',
        description: 'Default password (must follow password policy)'
      }
  
      #swagger.parameters['logo'] = {
        in: 'formData',
        required: false,
        type: 'file',
        description: 'System logo image'
      }
    */
    upload.single("logo"),
    createConfiguration
);

/**
 * Get configuration
 */
router.get(
    "/",
    /*
      #swagger.tags = ["Admin Configuration"]
      #swagger.summary = "Fetch system configuration"
      #swagger.description = "Returns current configuration including logo URL."
    */
    getConfiguration
);

/**
 * Update configuration
 */
router.put(
    "/",
    /*
      #swagger.tags = ["Admin Configuration"]
      #swagger.summary = "Update system configuration"
      #swagger.description = "Update default password or system logo."
  
      #swagger.autoBody = false
      #swagger.consumes = ["multipart/form-data"]
  
      #swagger.parameters['defaultPassword'] = {
        in: 'formData',
        required: false,
        type: 'string',
        description: 'New default password (must follow password policy)'
      }
  
      #swagger.parameters['logo'] = {
        in: 'formData',
        required: false,
        type: 'file',
        description: 'New system logo'
      }
    */
    upload.single("logo"),
    updateConfiguration
);

export default router;