import { Router } from "express";
import {
  getEmployeeProfileByUserId,
  getEmployeeProfilePictureByUserId,
  getEmployeeProfileStatusByUserId,
  updateEmployeeProfileByUserId,
  updateEmployeeProfilePictureByUserId,
} from "../../modules/employee-profiles/employeeprofile.controller";
import upload from "../../middlewares/multer";

const router = Router();

router.get(
  "/:userId",
  /*
    #swagger.tags = ["Employee Profile"]
    #swagger.summary = "Get employee profile by userId"

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  getEmployeeProfileByUserId
);

router.get(
  "/:userId/picture",
  /*
    #swagger.tags = ["Employee Profile"]
    #swagger.summary = "Get employee profile picture by userId"

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  getEmployeeProfilePictureByUserId
);

router.put(
  "/:userId",
  /*
    #swagger.tags = ["Employee Profile"]
    #swagger.summary = "Update employee profile"

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }

    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        name: "Jane Doe",
        email: "jane@example.com",
        phoneNumber: "+15551234567"
      }
    }
  */
  updateEmployeeProfileByUserId
);

router.put(
  "/:userId/picture",
  /*
    #swagger.tags = ["Employee Profile"]
    #swagger.summary = "Upload or update employee profile picture"
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
  updateEmployeeProfilePictureByUserId
);

router.get(
  "/:userId/status",
  /*
    #swagger.tags = ["Employee Profile"]
    #swagger.summary = "Get employee profile completion status"

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  getEmployeeProfileStatusByUserId
);

export default router;
