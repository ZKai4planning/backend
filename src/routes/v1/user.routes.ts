import { Router } from "express";
import { getUserCountAnalytics, getUsersPaginated, requestOtp, resendOtp, updateUserStatusByUserId, verifyOtp } from "../../modules/client-users/user.controller";





const router = Router();

router.get("/analytics",getUserCountAnalytics)
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.get("/", getUsersPaginated)
router.put("/:userId/status", updateUserStatusByUserId);




export default router;
