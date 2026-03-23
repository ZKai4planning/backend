import { Router } from "express";
import {
  getAdminProfileByUserId,
  getAdminProfilePictureByUserId,
  getAdminProfileStatusByUserId,
  updateAdminProfileByUserId,
  updateAdminProfilePictureByUserId,
} from "../../modules/admin-profiles/adminprofile.controller";
import upload from "../../middlewares/multer";

const router = Router();

router.get(
  "/:userId",
  /*
    #swagger.tags = ["Admin Profile"]
    #swagger.summary = "Get admin profile by userId"

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  getAdminProfileByUserId
);

router.get(
  "/:userId/picture",
  /*
    #swagger.tags = ["Admin Profile"]
    #swagger.summary = "Get admin profile picture by userId"

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  getAdminProfilePictureByUserId
);

router.put(
  "/:userId",
  /*
    #swagger.tags = ["Admin Profile"]
    #swagger.summary = "Update admin profile"

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }

    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "+15551234567"
      }
    }
  */
  updateAdminProfileByUserId
);

router.put(
  "/:userId/picture",
  /*
    #swagger.tags = ["Admin Profile"]
    #swagger.summary = "Upload or update admin profile picture"
    #swagger.autoBody = false
    #swagger.consumes = ["multipart/form-data"]

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }

    #swagger.parameters['profilePicture'] = {
      in: 'formData',
      required: true,
      type: 'file'
    }
  */
  upload.single("profilePicture"),
  updateAdminProfilePictureByUserId
);

router.get(
  "/:userId/status",
  /*
    #swagger.tags = ["Admin Profile"]
    #swagger.summary = "Get admin profile completion status"

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  getAdminProfileStatusByUserId
);

export default router;
