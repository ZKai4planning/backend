import { Request, Response } from "express";
import {
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
} from "../../utils/validators";
import { User } from "./user.model";
import { generateOTP, generateId } from "../../utils/generators";
import { UserProfile } from "../client-user-profiles/userprofile.model";
import { generateToken }  from "../../security/jwtService";
import { sendOtpEmail } from "../../services/email.service";
import { MAX_OTP_ATTEMPTS, OTP_LOCK_DURATION_MS } from "../../constants/auth";
import { isAccountLocked } from "../../utils/auth";

const hasCompletedProfile = (profile: any) => {
  if (!profile?.createdAt || !profile?.updatedAt) return false;
  return (
    new Date(profile.updatedAt).getTime() >
    new Date(profile.createdAt).getTime()
  );
};

const deriveFullNameFromEmail = (email: string) => {
  const localPart = email.split("@")[0] || "";
  const cleaned = localPart
    .replace(/[._-]+/g, " ")
    .replace(/[^A-Za-z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 2) return undefined;

  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};


export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { identifier: rawIdentifier, phoneNumber: rawPhoneNumber, fullName } =
      req.body;
    let identifier = normalizePhone(rawIdentifier);
    const phoneNumber = normalizePhone(rawPhoneNumber);

    if (!identifier) {
      return res.status(400).json({ message: "Email or phone required" });
    }

    let query: any = {};
    let type: "email" | "phone";

    if (isValidEmail(identifier)) {
      identifier = normalizeEmail(identifier) as string;
      query.email = identifier;
      type = "email";
    } else if (isValidPhone(identifier)) {
      query.phoneNumber = identifier;
      type = "phone";
    } else {
      return res.status(400).json({ message: "Invalid email or phone format" });
    }

    if (phoneNumber && !isValidPhone(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    if (type === "phone" && phoneNumber && phoneNumber !== identifier) {
      return res.status(400).json({
        message: "identifier and phoneNumber must match when identifier is a phone",
      });
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
      const finalPhoneNumber =
        type === "phone" ? identifier : phoneNumber || undefined;
      const providedFullName =
        typeof fullName === "string" ? fullName.trim() : undefined;
      const finalFullName =
        providedFullName || (type === "email" ? deriveFullNameFromEmail(identifier) : undefined);

      if (finalPhoneNumber) {
        const existingPhone = await User.findOne({ phoneNumber: finalPhoneNumber });
        if (existingPhone) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }

      try {
        user = await User.create({
          userId,
          email: type === "email" ? identifier : undefined,
          phoneNumber: finalPhoneNumber,
          fullName: finalFullName,
        });
      } catch (createErr: any) {
        if (createErr?.code === 11000) {
          if (createErr?.keyPattern?.phoneNumber) {
            return res
              .status(400)
              .json({ message: "Phone number already in use" });
          }
          if (createErr?.keyPattern?.email) {
            return res.status(400).json({ message: "Email already in use" });
          }
        }
        throw createErr;
      }

      await UserProfile.create({
        profileId,
        userRefId: user.userId,
        bio: "",
        profilePicture: "",
      });
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp; // (we’ll hash later)
    user.otpExpiresAt = expires;
    await user.save();

    if (type === "email") {
      await sendOtpEmail(identifier, otp);
    } else {
      // Phone OTP sending not implemented yet
      console.log("OTP (for testing):", otp);
    }

    res.json({
      message: "OTP sent successfully",
      userId: user.userId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { identifier: rawIdentifier, otp } = req.body;
    const identifier = normalizePhone(rawIdentifier);

    if (!identifier || !otp) {
      return res.status(400).json({ message: "Identifier and OTP required" });
    }

    const normalizedIdentifier = isValidEmail(identifier)
      ? (normalizeEmail(identifier) as string)
      : identifier;

    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { phoneNumber: normalizedIdentifier },
      ],
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

    const profile = await UserProfile.findOne({ userRefId: user.userId })
      .select("createdAt updatedAt")
      .lean();
    const nextStep = hasCompletedProfile(profile) ? "DASHBOARD" : "PROFILE";

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
      nextStep,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { identifier: rawIdentifier } = req.body;
    const identifier = normalizePhone(rawIdentifier);

    if (!identifier) {
      return res.status(400).json({ message: "Email or phone required" });
    }

    const normalizedIdentifier = isValidEmail(identifier)
      ? (normalizeEmail(identifier) as string)
      : identifier;

    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { phoneNumber: normalizedIdentifier },
      ],
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

    const isEmail = isValidEmail(identifier);
    if (isEmail) {
      await sendOtpEmail(normalizedIdentifier, otp);
    } else {
      // Phone OTP sending not implemented yet
      console.log("Resent OTP:", otp);
    }

    res.json({
      message: "OTP resent successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};




export const updateUserStatusByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
 
    // 1️⃣ Validate input
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "`isActive` must be a boolean",
      });
    }
 
    // 2️⃣ Find user
    const user = await User.findOne({ userId });
 
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
 
    // 3️⃣ Update status
    user.isActive = isActive;
    await user.save();
 
    res.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: {
        userId: user.userId,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        status: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update User Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getUsersPaginated = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit
 
    const matchStage: any = {}
 
    // Optional isActive filter: true/false
    if (req.query.isActive !== undefined) {
      matchStage.isActive = req.query.isActive === "true"
    }
 
    const users = await User.aggregate([
      { $match: matchStage },
 
      // JOIN with userprofiles
      {
        $lookup: {
          from: "userprofiles", // ⚠️ collection name (plural, lowercase)
          localField: "userId",
          foreignField: "userRefId",
          as: "profile",
        },
      },
 
      // convert array → object
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },
 
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
 
      // final shape
      {
        $project: {
          otp: 0,
          otpExpiresAt: 0,
          __v: 0,
          "profile.__v": 0,
        },
      },
    ])
 
    const total = await User.countDocuments(matchStage)
 
    res.json({
      page,
      limit,
      total,
      users,
    })
  } catch (error) {
    console.error("Get Users Paginated Error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
 
export const getUserCountAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await User.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          active: [
            { $match: { isActive: true } },
            { $count: "count" },
          ],
          inactive: [
            { $match: { isActive: false } },
            { $count: "count" },
          ],
        },
      },
    ])
 
    const getCount = (arr: any[]) => (arr.length ? arr[0].count : 0)
 
    res.json({
      totalUsers: getCount(result[0].total),
      activeUsers: getCount(result[0].active),
      inactiveUsers: getCount(result[0].inactive),
    })
  } catch (error) {
    console.error("User Count Analytics Error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
