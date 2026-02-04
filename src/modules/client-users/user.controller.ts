import { Request, Response } from "express";
import { isValidEmail, isValidPhone } from "../../utils/validators";
import { User } from "./user.model";
import { generateOTP, generateId } from "../../utils/generators";
import { UserProfile } from "../client-user-profiles/userprofile.model";
import { generateToken } from "../../utils/jwt";



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

    // 1. Find existing user
    let user = await User.findOne(query);

    // 2. If not exists → create new user
    if (!user) {
      const userId = await generateId();

      const profileId = await generateId();

      user = await User.create({
        userId,
        email: type === "email" ? identifier : undefined,
        phoneNumber: type === "phone" ? identifier : undefined,
        status: 0,
      });

      await UserProfile.create({
        profileId: profileId,
        userRefId: user.userId,
        fullName: "",
        bio: "",
        profilePicture: "",
      });
    }

    // 3. Generate OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = expires;
    await user.save();

    console.log("OTP (for testing):", otp);

    res.json({
      message: "OTP sent successfully",
      userId: user.userId,
      isNewUser: user.status === 0,
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

    // OTP validation
    if (
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    // OTP is valid → activate user
    user.status = 0;
    user.otp = null;
    user.otpExpiresAt = null;
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
       
        status: user.status,
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