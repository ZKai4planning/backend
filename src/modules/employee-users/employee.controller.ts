import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Employee } from "./employee.model";
import { Role } from "../role-permissions/role.model";
import { generateId, generateOTP } from "../../utils/generators";
import { generateToken }  from "../../security/jwtService";
import { Configuration } from "../admin-configuration/config.model";
import { sendEmployeeWelcomeEmail, sendOtpEmail } from "../../services/email.service";
import { STATUS_CODES } from "http";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 60 * 1000;

export const loginEmployee = async (req: Request, res: Response) => {
  try {
    const { email, password, region } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRegion =
      typeof region === "string" ? region.trim().toLowerCase() : region;

    if (normalizedRegion !== "in" && normalizedRegion !== "uk") {
      return res.status(400).json({ message: "Region must be 'in' or 'uk'" });
    }

    const employee = await Employee.findOne({ email: normalizedEmail }).select(
      "+password +oldPassword +passwordStatus +passwordExpireFlag +loginAttempts +lockUntil +otp +otpExpiresAt"
    );

    if (!employee) {
      return res.status(404).json({ message: "Invalid email or password." });
    }

    if (employee.region !== normalizedRegion) {
      return res.status(403).json({ message: "Invalid email or password." });
    }

    if (employee.lockUntil && employee.lockUntil > new Date()) {
      return res.status(423).json({
        message: "Account is locked due to multiple failed login attempts",
        lockUntil: employee.lockUntil,
      });
    }

    if (!employee.isActive) {
      return res.status(403).json({ message: "Invalid email or password." });
    }

    let isPasswordValid = false;

    if (employee.passwordStatus === -1) {
      const config = await Configuration.findOne();
      if (!config) {
        return res.status(500).json({ message: "Configuration not found" });
      }
      isPasswordValid = password === config.plainDefaultPassword;
    } else {
      isPasswordValid = await bcrypt.compare(password, employee.password);
    }
    if (!isPasswordValid) {
      employee.loginAttempts += 1;

      if (employee.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        employee.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }

      await employee.save();

      return res.status(401).json({
        message: "Invalid email or password.",
        remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - employee.loginAttempts),
        locked: employee.lockUntil && employee.lockUntil > new Date(),
      });
    }

    employee.loginAttempts = 0;
    employee.lockUntil = null;
    employee.lastLoginAt = new Date();
    await employee.save();

    employee.loginAttempts = 0;
    employee.lockUntil = null;

    // Generate OTP
    employee.otp = generateOTP();
    employee.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await employee.save();

    await sendOtpEmail(employee.email, employee.otp);

    const mustResetPassword =
      employee.passwordStatus === -1 || employee.passwordExpireFlag === 1;

    res.status(200).json({
      message: "If the credentials are valid, an OTP has been sent to your registered email.",
      userId: employee.userId,
      mustResetPassword,
      otpExpiresAt: employee.otpExpiresAt,
    });
  } catch (error) {
    console.error("Employee Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmployeeOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const employee = await Employee.findOne({ email: normalizedEmail }).select(
      "+otp +otpExpiresAt +passwordStatus +passwordExpireFlag"
    );

    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!employee.otp || employee.otp !== otp || employee.otpExpiresAt! < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    employee.otp = null;
    employee.otpExpiresAt = null;
    employee.lastLoginAt = new Date();
    await employee.save();

    const token = generateToken({
      userId: employee.userId,
      role: "employee",
      roleId: employee.roleId,
    });

    if (employee.passwordStatus === -1 || employee.passwordExpireFlag === 1) {
      return res.status(201).json({
        message: "Redirect to reset password",
        STATUS_CODES: STATUS_CODES.CREATED,
        data: {
          email: employee.email,
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
  } catch (error) {
    console.error("Verify Employee OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendEmployeeOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const employee = await Employee.findOne({ email: normalizedEmail }).select(
      "+otp +otpExpiresAt"
    );

    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    employee.otp = generateOTP();
    employee.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await employee.save();

    await sendOtpEmail(employee.email, employee.otp);

    res.json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend Employee OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetEmployeePassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const employee = await Employee.findOne({ email: normalizedEmail }).select(
      "+password +oldPassword +passwordStatus +passwordExpireFlag"
    );

    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    const canReset =
      employee.passwordStatus === -1 || employee.passwordExpireFlag === 1;
    if (!canReset) {
      return res.status(403).json({ message: "Password reset not allowed" });
    }

    const isSameAsCurrent = await bcrypt.compare(
      newPassword,
      employee.password
    );
    if (isSameAsCurrent) {
      return res.status(400).json({
        message: "New password cannot be same as current password",
      });
    }

    if (employee.oldPassword) {
      const isSameAsOld = await bcrypt.compare(
        newPassword,
        employee.oldPassword
      );
      if (isSameAsOld) {
        return res.status(400).json({
          message: "New password cannot be same as old password",
        });
      }
    }

    const config = await Configuration.findOne();
    const isSameAsDefault = newPassword === config?.plainDefaultPassword;
    if (isSameAsDefault) {
      return res.status(400).json({
        message: "New password cannot be same as default password",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    employee.oldPassword = employee.password;
    employee.password = hashed;
    employee.passwordStatus = 0;
    employee.passwordExpireFlag = 0;
    await employee.save();

    res.status(201).json({
      message: "Password reset successful",
      STATUS_CODES: STATUS_CODES.CREATED,
      data: {
        userId: employee.userId,
        nextStep: "LOGIN",
      },
    });
  } catch (error) {
    console.error("Reset Employee Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createEmployeeUser = async (req: Request, res: Response) => {
  try {
    const { name, email, roleId, region } = req.body;

    const role = await Role.findOne({ roleId, status: 0 });
    if (!role) {
      return res.status(400).json({
        message: "Role does not exist or is inactive",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const employeeExists = await Employee.findOne({ email: normalizedEmail });
    if (employeeExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const config = await Configuration.findOne();
    if (!config?.defaultPassword) {
      return res.status(400).json({
        message: "Default password not configured",
      });
    }

    let userId = generateId();
    while (await Employee.findOne({ userId })) {
      userId = generateId();
    }

    const employee = await Employee.create({
      userId,
      name,
      email: normalizedEmail,
      roleId: role.roleId,
      region,
      password: config.defaultPassword,
      passwordStatus: -1,
      passwordExpireFlag: 0,
      resetPasswordStatus: "none",
      isActive: true,
    });

    // Send email after successful creation
    await sendEmployeeWelcomeEmail(
      normalizedEmail,
      config.defaultPassword,
      name
    );

    res.status(201).json({
      message: "Employee created successfully",
      employee,
    });
  } catch (error) {
    console.error("Create Employee Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeUsers = async (_req: Request, res: Response) => {
  try {
    const employees = await Employee.find().select("-password -otp -otpExpiresAt");

    const employeesWithRoleName = await Promise.all(
      employees.map(async (employee) => {
        const role = await Role.findOne({ roleId: employee.roleId });
        return {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          region: employee.region,
          isActive: employee.isActive,
          roleId: employee.roleId,
          resetPasswordStatus: employee.resetPasswordStatus,
          userId: employee.userId,
          roleName: role ? role.roleName : "Unknown",
          createdAt: (employee as any).createdAt,
          updatedAt: (employee as any).updatedAt,
        };
      })
    );

    res.json(employeesWithRoleName);
  } catch (error) {
    console.error("Get Employee Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateEmployeeByUserId = async (req: Request, res: Response) => {
  try {
    const { userid: userId } = req.params;
    const { name, email, roleId, region, isActive } = req.body;

    if (email !== undefined) {
      return res.status(400).json({
        message: "Employee email cannot be updated once created",
      });
    }

    if (roleId) {
      const role = await Role.findOne({ roleId, status: 0 });
      if (!role) {
        return res.status(400).json({
          message: "Role does not exist or is inactive",
        });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (region !== undefined) updateData.region = region;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Request body is required",
      });
    }

    const employee = await Employee.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    ).select("-password -otp -otpExpiresAt");

    if (!employee) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    res.json({
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const employee = await Employee.findOne({ userId }).select(
      "-password -otp -otpExpiresAt"
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    const role = await Role.findOne({ roleId: employee.roleId });

    res.json({
      userId: employee.userId,
      name: employee.name,
      email: employee.email,
      region: employee.region,
      isActive: employee.isActive,
      resetPasswordStatus: employee.resetPasswordStatus,
      role: {
        roleId: employee.roleId,
        roleName: role ? role.roleName : null,
      },
      createdAt: (employee as any).createdAt,
      updatedAt: (employee as any).updatedAt,
    });
  } catch (error) {
    console.error("Get Employee By UserId Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleEmployeeStatusByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    res.json({
      message: `Employee ${employee.isActive ? "activated" : "inactivated"} successfully`,
      employee: {
        userId: employee.userId,
        name: employee.name,
        email: employee.email,
        roleId: employee.roleId,
        region: employee.region,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle Employee Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeUserAnalytics = async (_req: Request, res: Response) => {
  try {
    const analytics = await Employee.aggregate([
      {
        $facet: {
          totalEmployees: [{ $count: "count" }],
          regionCounts: [
            {
              $group: {
                _id: "$region",
                count: { $sum: 1 },
              },
            },
          ],
          activeUsers: [{ $match: { isActive: true } }, { $count: "count" }],
          inactiveUsers: [{ $match: { isActive: false } }, { $count: "count" }],
        },
      },
    ]);

    const result = analytics[0];
    const getCount = (arr: any[]) => (arr.length ? arr[0].count : 0);

    const regionMap = result.regionCounts.reduce(
      (acc: any, cur: any) => {
        acc[cur._id] = cur.count;
        return acc;
      },
      { in: 0, uk: 0 }
    );

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
    });
  } catch (error) {
    console.error("Employee Analytics Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
