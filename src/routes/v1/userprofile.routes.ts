import { Router } from "express";

import upload from "../../middlewares/multer";
import { getProfileByUserId, updateProfileByUserId, updateProfilePictureByUserId } from "../../modules/client-user-profiles/userprofile.controller";


const router = Router();

router.get("/:userId", getProfileByUserId);
router.put("/:userId", updateProfileByUserId);
router.put(
  "/profile/:userId/picture",
  upload.single("profilePicture"), 
  updateProfilePictureByUserId
);

export default router;
