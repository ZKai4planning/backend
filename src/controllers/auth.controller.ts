import { Request, Response } from "express";
import { generateOTP } from "../utils/otp.util";
import { sendOtpEmail } from "../services/email.service";
import { saveOtp, verifyOtp } from "../services/otp.service";
import { log } from "../utils/log";
import { generateId } from "../utils/generators";
import { User } from "../modules/client-users/user.model";
import { UserProfile } from "../modules/client-user-profiles/userprofile.model";
import { generateToken } from "../utils/jwt";

const logger = log("AuthController");


// export const sendOtp = async (req: Request, res: Response) => {
//   const { email } = req.body;

//   if (!email) {
//     logger.warn("OTP request without email");
//     return res.status(400).json({ success: false, message: "Email is required" });
//   }

//   logger.info(`OTP request received for ${email}`);

//   const otp = generateOTP();
//   await saveOtp(email, otp);

//   logger.debug("OTP generated and stored");

//   await sendOtpEmail(email, otp);

//   res.json({ success: true, message: "OTP sent" });
// };


// export const verifyOtpHandler = async (
//   req: Request,
//   res: Response
// ) => {
//   const { email, otp } = req.body;

//   logger.info(`OTP verification attempt for ${email}`);

//   const isValid = await verifyOtp(email, otp);

//   if (!isValid) {
//     logger.warn(`Invalid OTP attempt for ${email}`);
//     return res.status(400).json({
//       success: false,
//       message: "Invalid OTP",
//     });
//   }

//   logger.info(`OTP verified successfully for ${email}`);

//   res.json({ success: true, message: "OTP verified" });
// };



export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      logger.warn("OTP request without email");
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    logger.info(`OTP request received for ${email}`);

    // 1. Find existing user
    let user = await User.findOne({ email });

    // 2. If user does not exist → create user + profile
    if (!user) {
      const userId = await generateId();
      const profileId = await generateId();

      user = await User.create({
        userId,
        email,
        status: 0, // new user
      });

      await UserProfile.create({
        profileId,
        userRefId: userId,
        fullName: "",
        bio: "",
        profilePicture: "",
      });

      logger.info(`New user created for ${email}`);
    }

    // 3. Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = expiresAt;
    await user.save();

    logger.debug(`OTP generated for ${email}`);

    // 4. Send OTP
    await sendOtpEmail(email, otp);

    res.json({
      success: true,
      message: "OTP sent successfully",
      isNewUser: user.status === 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




export const verifyOtpHandler = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    logger.info(`OTP verification attempt for ${email}`);

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`User not found for ${email}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate OTP
    if (
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      logger.warn(`Invalid or expired OTP for ${email}`);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // OTP valid → activate user
    user.status = 1;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = generateToken({
      userId: user.userId,
    });

    logger.info(`OTP verified successfully for ${email}`);

    res.json({
      success: true,
      message: "OTP verified successfully",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    logger.info(`Resend OTP request for ${email}`);

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`Resend OTP attempted for non-existing user: ${email}`);
      return res.status(404).json({
        success: false,
        message: "User not found. Please request OTP first.",
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = expiresAt;
    await user.save();

    logger.debug(`New OTP generated for ${email}`);

    // Send OTP
    await sendOtpEmail(email, otp);

    res.json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};