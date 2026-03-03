import { Request, Response } from "express";
import { generateOTP } from "../utils/otp.util";
import { sendOtpEmail } from "../services/email.service";
import { saveOtp, verifyOtp } from "../services/otp.service";
import { log } from "../utils/log";
import { generateId } from "../utils/generators";
import { User } from "../modules/client-users/user.model";
import { UserProfile } from "../modules/client-user-profiles/userprofile.model";
import { generateToken } from "../utils/jwt";
import { isValidEmail, isValidPhone } from "../utils/validators";
import { isAccountLocked } from "../utils/auth";
import { MAX_OTP_ATTEMPTS, OTP_LOCK_DURATION_MS } from "../constants/auth";

const logger = log("AuthController");


export const sendOtp = async (req: Request, res: Response) => {
 try {
     const { identifier } = req.body;
 
     if (!identifier) {
       return res.status(400).json({ message: "Email or phone required" });
     }
 
     let query: any = {};
     let type: "email" | "phone";
 
     if (isValidEmail(identifier)) {
       query.email = identifier;
       type = "email";
     } else if (isValidPhone(identifier)) {
       query.phoneNumber = identifier;
       type = "phone";
     } else {
       return res.status(400).json({ message: "Invalid email or phone format" });
     }
 
     let user = await User.findOne(query);
 
     if (user) {
       // 🔒 Check lock
       if (isAccountLocked(user)) {
         return res.status(423).json({
           message: "Account locked due to multiple failed OTP attempts. Try again later.",
           lockUntil: user.lockUntil,
         });
       }
 
       // 🧹 Auto-unlock if expired
       if (user.lockUntil && user.lockUntil <= new Date()) {
         user.lockUntil = null;
         user.loginAttempts = 0;
       }
     }
 
     if (!user) {
       const userId = await generateId();
       const profileId = await generateId();
 
       user = await User.create({
         userId,
         email: type === "email" ? identifier : undefined,
         phoneNumber: type === "phone" ? identifier : undefined,
       });
 
       await UserProfile.create({
         profileId,
         userRefId: user.userId,
         fullName: "",
         bio: "",
         profilePicture: "",
       });
     }
 
     const otp = generateOTP();
     const expires = new Date(Date.now() + 5 * 60 * 1000);
 
     user.otp = otp; 
     user.otpExpiresAt = expires;
     await user.save();
 
     // ❌ remove in prod
     console.log("OTP (for testing):", otp);
 
     res.json({
       message: "OTP sent successfully",
       userId: user.userId,
     });
   } catch (err) {
     console.error(err);
     res.status(500).json({ message: "Server error" });
   }
 };




export const verifyOtpHandler = async (req: Request, res: Response) => {
 try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: "Identifier and OTP required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 Check lock
    if (isAccountLocked(user)) {
      return res.status(423).json({
        message: "Account locked due to multiple failed OTP attempts",
        lockUntil: user.lockUntil,
      });
    }

    const isOtpInvalid =
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date();

    if (isOtpInvalid) {
      user.loginAttempts += 1;

      // 🚫 Lock if max attempts reached
      if (user.loginAttempts >= MAX_OTP_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + OTP_LOCK_DURATION_MS);
      }

      await user.save();

      return res.status(401).json({
        message: "Invalid or expired OTP",
        remainingAttempts: Math.max(
          MAX_OTP_ATTEMPTS - user.loginAttempts,
          0
        ),
      });
    }

    // ✅ OTP is valid → reset everything
    user.otp = null;
    user.otpExpiresAt = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    user.isActive = true;

    await user.save();

    const token = generateToken({
      userId: user.userId,
    });

    res.json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Email or phone required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please request OTP first.",
      });
    }

    if (isAccountLocked(user)) {
  return res.status(423).json({
    message: "Account locked. Cannot resend OTP.",
    lockUntil: user.lockUntil,
  });
}


    // Generate new OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = expires;
    await user.save();

    console.log("Resent OTP:", otp);

    res.json({
      message: "OTP resent successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

