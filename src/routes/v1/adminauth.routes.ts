import express from "express";
import {
  adminLogin,
  verifyOtp,
  resendOtp,
  resetPasswordByUserId,
} from "../../modules/admin-users/adminuser.controller";

import {

  verifyAdminOtpSchema,
  resendOtpSchema,
  resetPasswordSchema,
} from "../../schemas/adminuser";

import { validate } from "../../middlewares/zod.middleware";

const router = express.Router();

// LOGIN → generates OTP
router.post("/login",  adminLogin);

// VERIFY OTP → JWT
router.post("/verify-otp", validate(verifyAdminOtpSchema), verifyOtp);

// RESEND OTP
router.post("/resend-otp", validate(resendOtpSchema), resendOtp);

// RESET PASSWORD
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordByUserId);

export default router;
