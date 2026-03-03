import { Router } from "express";

import { getUserCountAnalytics, getUsersPaginated, updateUserStatusByUserId } from "../../modules/client-users/user.controller";
import { sendOtp, verifyOtpHandler, resendOtp } from "../../controllers/auth.controller";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpHandler);
router.post("/resend-otp", resendOtp);
router.get("/analytics", getUserCountAnalytics);
router.get("/users", getUsersPaginated);
router.put("/:userId/status", updateUserStatusByUserId);

export default router;
