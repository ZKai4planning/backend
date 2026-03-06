import express from "express";
import {
  loginEmployee,
  resetEmployeePassword,
  verifyEmployeeOtp,
  resendEmployeeOtp,
} from "../../modules/employee-users/employee.controller";
import { validate } from "../../middlewares/zod.middleware";
import {
  loginEmployeeSchema,
  verifyEmployeeOtpSchema,
  resendEmployeeOtpSchema,
  resetEmployeePasswordSchema,
} from "../../schemas/employee";

const router = express.Router();

router.post("/login", validate(loginEmployeeSchema), loginEmployee);
router.post("/verify-otp", validate(verifyEmployeeOtpSchema), verifyEmployeeOtp);
router.post("/resend-otp", validate(resendEmployeeOtpSchema), resendEmployeeOtp);
router.post(
  "/reset-password",
  validate(resetEmployeePasswordSchema),
  resetEmployeePassword
);

export default router;
