import express from "express";
import {
  createAdminUser,
  getAdminUsers,
  updateAdminByUserId,

  toggleAdminStatusByUserId,
  getAdminByUserId,
  getAdminUserAnalytics,
} from "../../modules/admin-users/adminuser.controller";

import {
  createAdminSchema,
  updateAdminSchema,
  adminStatusSchema,
} from "../../schemas/adminuser";

import {validate} from "../../middlewares/zod.middleware";

const router = express.Router();


router.get("/analytics", getAdminUserAnalytics)
router.post("/", validate(createAdminSchema), createAdminUser);
router.get("/", getAdminUsers);
router.put("/:userid", validate(updateAdminSchema), updateAdminByUserId);
router.patch("/:userId/status", toggleAdminStatusByUserId);
router.get("/:userId", getAdminByUserId);


export default router;
