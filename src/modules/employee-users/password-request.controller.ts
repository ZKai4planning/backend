import { Request, Response } from "express";
import { Employee } from "../employee-users/employee.model";
import { PasswordRequest } from "./password-request.model";
import { generateId } from "../../utils/generators";
import {
  sendPasswordResetApprovedEmail,
  sendPasswordRequestNotificationToAdmins,
  sendPasswordRequestRejectedEmail,
} from "../../services/email.service";
import { AdminUser } from "../admin-users/adminuser.model";
import { Configuration } from "../admin-configuration/config.model";

/* =========================================================
   1. Employee → Raise Password Reset Request
========================================================= */
export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "If this email is registered, your password reset request has been sent to the administrator for approval.",
            });
        }

        const existingRequest = await PasswordRequest.findOne({
            userRefId: employee.userId,
            status: "pending",
        });

        if (existingRequest) {
            return res.status(409).json({
                success: false,
                message: "A password reset request is already pending",
            });
        }

        const requestId = generateId();

        await PasswordRequest.create({
            requestId,
            userRefId: employee.userId,
            email: employee.email,
            status: "pending",
        });

        // TODO: Notify admins (email / websocket / queue)
        const admins = await AdminUser.find({ isActive: true }).select("email");

        await sendPasswordRequestNotificationToAdmins(
            admins.map((a) => a.email),
            employee.email
        );

        return res.status(201).json({
            success: true,
            message: "Password reset request submitted successfully",
            data: { requestId },
        });
    } catch (error) {
        console.error("requestPasswordReset:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

/* =========================================================
   2. Admin → Get Password Requests (with filters)
========================================================= */
export const getPasswordRequests = async (req: Request, res: Response) => {
  try {
    let { status, page = "1", limit = "10" } = req.query;

    // Parse safely
    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(
      50, // max limit cap
      Math.max(1, parseInt(limit as string, 10) || 10)
    );

    const skip = (pageNumber - 1) * pageSize;

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Execute queries in parallel
    const [requests, total] = await Promise.all([
      PasswordRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      PasswordRequest.countDocuments(query),
    ]);

    // Pagination metadata
    const totalPages = Math.ceil(total / pageSize);

    return res.status(200).json({
      success: true,
      data: requests,
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
   3. Admin → Approve Request
========================================================= */
export const approvePasswordRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const adminId = (req as any).user?.userId;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "requestId is required",
            });
        }

        const request = await PasswordRequest.findOne({ requestId });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Request already ${request.status}`,
            });
        }

        const employee = await Employee.findOne({
            userId: request.userRefId,
        }).select(
            "+password +oldPassword +loginAttempts +lockUntil +otp +otpExpiresAt"
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        const config = await Configuration.findOne();
        if (!config?.defaultPassword || !config?.plainDefaultPassword) {
            return res.status(400).json({
                success: false,
                message: "Default password not configured",
            });
        }

        /* ---------- Update Employee ---------- */
        employee.oldPassword = employee.password;
        employee.password = config.defaultPassword;
        employee.passwordStatus = -1; // force reset
        employee.passwordExpireFlag = 0;
        employee.loginAttempts = 0;
        employee.lockUntil = null;
        employee.otp = null;
        employee.otpExpiresAt = null;

        // Optional: 180-day expiry
        // employee.passwordExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

        await employee.save();

        /* ---------- Update Request ---------- */
        request.status = "approved";
        request.processedAt = new Date();
        request.processedBy = adminId;

        await request.save();

        /* ---------- Send Email ---------- */
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
   4. Admin → Reject Request
========================================================= */
export const rejectPasswordRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body; // optional
        const adminId = (req as any).user?.userId;

        const request = await PasswordRequest.findOne({ requestId });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Request already ${request.status}`,
            });
        }

        request.status = "rejected";
        request.processedAt = new Date();
        request.processedBy = adminId;

        await request.save();

        // Send rejection email
        await sendPasswordRequestRejectedEmail(request.email, reason);

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
