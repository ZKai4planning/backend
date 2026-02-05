import { Request, Response } from "express";
import { AdminUser } from "./adminuser.model";

import { Configuration } from "../admin-configuration/config.model";
import { generateOTP, generateId, getRemainingLockTime } from "../../utils/generators";

import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt";
import { STATUS_CODES } from "http";
import { config, email } from "zod";
import { Role } from "../role-permissions/role.model";
import { resendOtpSchema, resetPasswordSchema, updateAdminSchema, verifyAdminOtpSchema } from "../../schemas/adminuser";
// CREATE ADMIN
export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { name, email, roleId, region } = req.body;

    // ✅ Check role exists & active
    const role = await Role.findOne({ roleId, status: 0 });
    if (!role) {
      return res.status(400).json({
        message: "Role does not exist or is inactive",
      });
    }

    const adminExists = await AdminUser.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "user with this email already exists"});
    }

    // Get default password
    const config = await Configuration.findOne();
    if (!config?.defaultPassword) {
      return res.status(400).json({
        message: "Default password not configured",
      });
    }
  // Generate unique userId
    let userId = generateId();

    // Ensure uniqueness (retry if collision)
    while (await AdminUser.findOne({ userId })) {
      userId = generateId();
    }
    const admin = await AdminUser.create({
              userId,
      name,
      email,
      roleId: role.roleId,
      region,
      password: config.defaultPassword, // hashed
      isActive: true,
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ADMINS
export const getAdminUsers = async (_req: Request, res: Response) => {
  try {
    const admins = await AdminUser.find().select("-password");

    // Map each admin to include roleName
    const adminsWithRoleName = await Promise.all(
      admins.map(async (admin) => {
        const role = await Role.findOne({ roleId: admin.roleId });
        return {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          region: admin.region,
          isActive: admin.isActive,
          roleId: admin.roleId,
          userId: admin.userId,
          roleName: role ? role.roleName : "Unknown",
          createdAt: (admin as any).createdAt,
          updatedAt: (admin as any).updatedAt,
        };
      })
    );

    res.json(adminsWithRoleName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateAdminByUserId = async (req: Request, res: Response) => {
  try {
    const { userid: userId } = req.params;
    const { name, email, roleId, region, isActive } = req.body;

    // 1️⃣ Validate body
    const parsed = updateAdminSchema.safeParse({
      name,
      email,
      roleId,
      region,
      isActive,
    });

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // 2️⃣ Validate roleId (if provided)
    if (roleId) {
      const role = await Role.findOne({ roleId, status: 1 });
      if (!role) {
        return res.status(400).json({
          message: "Role does not exist or is inactive",
        });
      }
    }

    // 3️⃣ Build update object (simple + explicit)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (region !== undefined) updateData.region = region;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Request body is required",
      });
    }

    // 4️⃣ Update admin by userId
    const admin = await AdminUser.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    res.json({
      message: "Admin updated successfully",
      admin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



export const getAdminByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const admin = await AdminUser.findOne({ userId }).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    const role = await Role.findOne({ roleId: admin.roleId });

    res.json({
      userId: admin.userId,
      name: admin.name,
      email: admin.email,
      region: admin.region,
      isActive: admin.isActive,
      role: {
        roleId: admin.roleId,
        roleName: role ? role.roleName : null,
      },
      createdAt: (admin as any).createdAt,
      updatedAt: (admin as any).updatedAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// ACTIVATE / INACTIVATE
export const toggleAdminStatusByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const admin = await AdminUser.findOne({ userId });

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      message: `Admin ${
        admin.isActive ? "activated" : "inactivated"
      } successfully`,
      admin: {
        userId: admin.userId,
        name: admin.name,
        email: admin.email,
        roleId: admin.roleId,
        region: admin.region,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const config = await Configuration.findOne();
    if (!config) {
      return res.status(500).json({ message: "Configuration not found" });
    }

    const admin = await AdminUser
      .findOne({ email })
      .select("+password +loginAttempts +lockUntil");

    if (!admin) {
      return res.status(404).json({ message: "Account not found" });
    }

    /* =========================
       ACCOUNT LOCK CHECK
    ========================= */
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      const hoursLeft = getRemainingLockTime(admin.lockUntil);
      return res.status(423).json({
        message: "Account is locked due to multiple failed login attempts",
        retryAfterHours: hoursLeft,
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    let isPasswordValid = false;

    /* =========================
       FIRST TIME LOGIN
    ========================= */
    if (admin.passwordStatus === -1) {
      isPasswordValid = password === config.plainDefaultPassword;
    }
    /* =========================
       NORMAL LOGIN
    ========================= */
    else {
      isPasswordValid = await bcrypt.compare(password, admin.password);
    }

    /* =========================
       FAILED LOGIN
    ========================= */
    if (!isPasswordValid) {
      admin.loginAttempts += 1;

      // Lock account after 5 attempts
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 60 * 1000); // 24 hours
      }

      await admin.save();

      return res.status(401).json({
        message: "Invalid credentials",
        remainingAttempts: Math.max(0, 5 - admin.loginAttempts),
        locked:
          admin.lockUntil && admin.lockUntil > new Date() ? true : false,
      });
    }

    /* =========================
       SUCCESSFUL LOGIN
    ========================= */
    admin.loginAttempts = 0;
    admin.lockUntil = null;

    // Generate OTP
    admin.otp = generateOTP();
    admin.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await admin.save();

    return res.status(200).json({
      message: "OTP sent successfully",
      userId: admin.userId,
      mustResetPassword:
        admin.passwordStatus === -1 || admin.passwordExpireFlag === 1,
      otpExpiresAt: admin.otpExpiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const parsed = verifyAdminOtpSchema.safeParse({ email, otp });
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const admin = await AdminUser
      .findOne({ email })
      .select("+otp +otpExpiresAt");

    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    // OTP check (enable in prod)
    if (!admin.otp || admin.otp !== otp || admin.otpExpiresAt! < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    admin.otp = null;
    admin.otpExpiresAt = null;
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateToken({
      userId: admin.userId,
      role: "admin",
      roleId: admin.roleId,
    });

    if (
      admin.passwordStatus === -1 ||
      admin.passwordExpireFlag === 1
    ) {
      return res.status(201).json({
        message: "Redirect to reset password",
        STATUS_CODES: STATUS_CODES.CREATED,
        data: {
          email,
    
          nextStep: "RESET_PASSWORD",
        },
      });
    }

    res.json({
      message: "OTP verified successfully",
      STATUS_CODES: STATUS_CODES.OK,
      data: {

        token,
        nextStep: "DASHBOARD",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const parsed = resendOtpSchema.safeParse({ email });
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const admin = await AdminUser
      .findOne({ email })
      .select("+otp +otpExpiresAt");

    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    admin.otp = generateOTP();
    admin.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await admin.save();

    res.json({
      message: "OTP resent successfully",
     
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const resetPasswordByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, newPassword } = req.body;

    const parsed = resetPasswordSchema.safeParse({ email, newPassword });
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const admin = await AdminUser
      .findOne({ email })
      .select("+password +oldPassword");

    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    const canReset =
      admin.passwordStatus === -1 || admin.passwordExpireFlag === 1;

    if (!canReset) {
      return res.status(403).json({ message: "Password reset not allowed" });
    }

    // ❌ Same as CURRENT password
    const isSameAsCurrent = await bcrypt.compare(
      newPassword,
      admin.password
    );
    if (isSameAsCurrent) {
      return res.status(400).json({
        message: "New password cannot be same as current password",
      });
    }

    // ❌ Same as OLD password (if exists)
    if (admin.oldPassword) {
      const isSameAsOld = await bcrypt.compare(
        newPassword,
        admin.oldPassword
      );
      if (isSameAsOld) {
        return res.status(400).json({
          message: "New password cannot be same as old password",
        });
      }
    }

    // ❌ Same as DEFAULT password
    const configData = await Configuration.findOne();
    const isSameAsDefault =
      newPassword === configData?.plainDefaultPassword;

    if (isSameAsDefault) {
      return res.status(400).json({
        message: "New password cannot be same as default password",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    admin.oldPassword = admin.password;
    admin.password = hashed;
    admin.passwordStatus = 0;
    admin.passwordExpireFlag = 0;

    await admin.save();

    res.status(201).json({
      message: "Password reset successful",
      STATUS_CODES: STATUS_CODES.CREATED,
      data: {
        userId: admin.userId,
        nextStep: "LOGIN",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAdminUserAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const analytics = await AdminUser.aggregate([
      {
        $facet: {
          // Total employees
          totalEmployees: [
            { $count: "count" }
          ],
 
          // Region counts
          regionCounts: [
            {
              $group: {
                _id: "$region",
                count: { $sum: 1 },
              },
            },
          ],
 
          // Active users
          activeUsers: [
            { $match: { isActive: true } },
            { $count: "count" },
          ],
 
          // Inactive users
          inactiveUsers: [
            { $match: { isActive: false } },
            { $count: "count" },
          ],
        },
      },
    ])
 
    const result = analytics[0]
 
    // Helper to safely extract counts
    const getCount = (arr: any[]) => (arr.length ? arr[0].count : 0)
 
    const regionMap = result.regionCounts.reduce(
      (acc: any, cur: any) => {
        acc[cur._id] = cur.count
        return acc
      },
      { in: 0, uk: 0 }
    )
 
    res.json({
      totalEmployees: getCount(result.totalEmployees),
      regions: {
        india: regionMap.in,
        uk: regionMap.uk,
      },
      status: {
        active: getCount(result.activeUsers),
        inactive: getCount(result.inactiveUsers),
      },
    })
  } catch (error) {
    console.error("Analytics Error:", error)
    res.status(500).json({ message: "Server error" })
  }
}
 
