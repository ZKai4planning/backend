import { Router } from "express";
import {
  sendOtp,
  verifyOtpHandler,
} from "../../controllers/auth.controller";
import { getUserCountAnalytics, getUsersPaginated, updateUserStatusByUserId } from "../../modules/client-users/user.controller";

const router = Router();

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtpHandler);

router.get("/analytics",getUserCountAnalytics)
router.get("/users", getUsersPaginated)
router.put("/:userId/status", updateUserStatusByUserId);


export default router;
