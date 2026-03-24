import { Request, Response } from "express";
import { Employee } from "../employee-users/employee.model";
import {
  sendPasswordResetApprovedEmail,
  sendPasswordRequestNotificationToAdmins,
  sendPasswordRequestRejectedEmail,
} from "../../services/email.service";
import { AdminUser } from "../admin-users/adminuser.model";
import { Configuration } from "../admin-configuration/config.model";

/* =========================================================
   1. Employee -> Raise Password Reset Request
========================================================= */
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const genericResponse = {
      success: true,
      message:
        "If an account with this email exists, a password reset request has been submitted for admin approval.",
    };

    const employee = await Employee.findOne({ email });

    if (employee && employee.resetPasswordStatus !== "pending") {
      employee.resetPasswordStatus = "pending";
      await employee.save();

      try {
        const admins = await AdminUser.find({ isActive: true }).select("email");

        if (admins.length > 0) {
          await sendPasswordRequestNotificationToAdmins(
            admins.map((admin) => admin.email),
            employee.email
          );
        }
      } catch (notifyError) {
        console.error("Admin notification failed:", notifyError);
      }
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("requestPasswordReset:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

/* =========================================================
   2. Admin -> Get Password Requests (with filters)
========================================================= */
export const getPasswordRequests = async (req: Request, res: Response) => {
  try {
    const { status, page = "1", limit = "10" } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const query: Record<string, unknown> = status
      ? { resetPasswordStatus: status }
      : { resetPasswordStatus: { $in: ["pending", "approved", "rejected"] } };

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .select("userId name email resetPasswordStatus createdAt updatedAt")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Employee.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return res.status(200).json({
      success: true,
      data: employees.map((employee) => ({
        userRefId: employee.userId,
        name: employee.name,
        email: employee.email,
        status: employee.resetPasswordStatus,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      })),
      pagination: {
        totalItems: total,
        currentPage: pageNumber,
        totalPages,
        pageSize,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("getPasswordRequests:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   3. Admin -> Approve Request
========================================================= */
export const approvePasswordRequest = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const employee = await Employee.findOne({
      userId,
      resetPasswordStatus: "pending",
    }).select("+password +oldPassword +loginAttempts +lockUntil +otp +otpExpiresAt");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Pending request not found for this user",
      });
    }

    const config = await Configuration.findOne();
    if (!config?.defaultPassword || !config?.plainDefaultPassword) {
      return res.status(400).json({
        success: false,
        message: "Default password not configured",
      });
    }

    employee.oldPassword = employee.password;
    employee.password = config.defaultPassword;
    employee.passwordStatus = -1;
    employee.passwordExpireFlag = 0;
    employee.resetPasswordStatus = "approved";
    employee.loginAttempts = 0;
    employee.lockUntil = null;
    employee.otp = null;
    employee.otpExpiresAt = null;

    await employee.save();

    await sendPasswordResetApprovedEmail(
      employee.email,
      config.plainDefaultPassword
    );

    return res.status(200).json({
      success: true,
      message: "Password reset approved successfully",
    });
  } catch (error) {
    console.error("approvePasswordRequest:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   4. Admin -> Reject Request
========================================================= */
export const rejectPasswordRequest = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const employee = await Employee.findOne({
      userId,
      resetPasswordStatus: "pending",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Pending request not found for this user",
      });
    }

    employee.resetPasswordStatus = "rejected";
    await employee.save();

    await sendPasswordRequestRejectedEmail(employee.email, reason);

    return res.status(200).json({
      success: true,
      message: "Request rejected successfully",
    });
  } catch (error) {
    console.error("rejectPasswordRequest:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
