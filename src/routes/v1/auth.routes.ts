import { Router } from "express";
import {
  sendOtp,
  verifyOtpHandler,
} from "../../controllers/auth.controller";

const router = Router();

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtpHandler);


export default router;
