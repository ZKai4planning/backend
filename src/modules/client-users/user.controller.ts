import { Request, Response } from "express";
import { isValidEmail, isValidPhone } from "../../utils/validators";
import { User } from "./user.model";
import { generateOTP, generateId } from "../../utils/generators";
import { UserProfile } from "../client-user-profiles/userprofile.model";
import { generateToken } from "../../utils/jwt";
import { MAX_OTP_ATTEMPTS, OTP_LOCK_DURATION_MS } from "../../constants/auth";
import { isAccountLocked } from "../../utils/auth";


export const requestOtp = async (req: Request, res: Response) => {
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

    user.otp = otp; // (we’ll hash later)
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


export const verifyOtp = async (req: Request, res: Response) => {
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
 
    await user.save();
 
    res.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: {
        userId: user.userId,
        email: user.email,
        phoneNumber: user.phoneNumber,
       
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
 
    // isActive filter (status: 0 = active, 1 = inactive)
    if (req.query.isActive !== undefined) {
      matchStage.status = req.query.isActive === "true" ? 0 : 1
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
            { $match: { status: 0 } },
            { $count: "count" },
          ],
          inactive: [
            { $match: { status: 1 } },
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