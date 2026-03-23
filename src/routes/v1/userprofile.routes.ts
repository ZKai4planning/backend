import { Router } from "express";
import upload from "../../middlewares/multer";

import {
  getProfileByUserId,
  getUserProfileStatusByUserId,
  updateProfileByUserId,
  updateProfilePictureByUserId
} from "../../modules/client-user-profiles/userprofile.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: UserProfile
 *   description: User profile management APIs
 */

/**
 * @swagger
 * /profile/{userId}:
 *   get:
 *     summary: Get user profile by userId
 *     tags: [UserProfile]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique user identifier
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Profile not found
 */
router.get("/:userId", getProfileByUserId);


/**
 * @swagger
 * /profile/{userId}:
 *   put:
 *     summary: Update user profile
 *     tags: [UserProfile]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique user identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Krishna Kumar
 *               phoneNumber:
 *                type: string
 *                example: +449876543210
 *               council:
 *                 type: string
 *                 example: Hyderabad Municipal Council
 *               phone:
 *                 type: object
 *                 properties:
 *                   countryCode:
 *                     type: string
 *                     example: +91
 *                   number:
 *                     type: string
 *                     example: 9876543210
 *               landline:
 *                 type: object
 *                 properties:
 *                   countryCode:
 *                     type: string
 *                     example: +91
 *                   number:
 *                     type: string
 *                     example: 4023456789
 *               address:
 *                 type: object
 *                 properties:
 *                   doorNo:
 *                     type: string
 *                     example: 12-3-45
 *                   street:
 *                     type: string
 *                     example: MG Road
 *                   locality:
 *                     type: string
 *                     example: Begumpet
 *                   city:
 *                     type: string
 *                     example: Hyderabad
 *                   state:
 *                     type: string
 *                     example: Telangana
 *                   country:
 *                     type: string
 *                     example: India
 *                   postalCode:
 *                     type: string
 *                     example: 500016
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Profile not found
 */
router.put("/:userId", updateProfileByUserId);


/**
 * @swagger
 * /profile/{userId}/picture:
 *   put:
 *     summary: Upload or update profile picture
 *     tags: [UserProfile]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: string
 *       - name: profilePicture
 *         in: formData
 *         type: file
 *         required: true
 *         description: Profile picture file
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *       400:
 *         description: File upload failed
 *       404:
 *         description: Profile not found
 */
router.put(
  "/:userId/picture",
  /*
    #swagger.tags = ["Client Profile"]
    #swagger.summary = "Upload or update profile picture"
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
  updateProfilePictureByUserId
);

router.get(
  "/:userId/status",
  /*
    #swagger.tags = ["UserProfile"]
    #swagger.summary = "Get user profile completion status"

    #swagger.parameters['userId'] = {
      in: 'path',
      required: true,
      type: 'string'
    }
  */
  getUserProfileStatusByUserId
);

export default router;
