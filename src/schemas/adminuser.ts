import { Request, Response } from "express";
import { email, z } from "zod";

/* =========================
   Name Validation
========================= */
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters long")
  .max(50, "Name must be at most 50 characters long")
  .regex(/^[A-Za-z ]+$/, "Name can contain only letters and spaces");

/* =========================
   Create Admin
========================= */
export const createAdminSchema = z.object({
  name: nameSchema,

  email: z
    .string()
    .email("Invalid email address"),

  roleId: z
    .string()
    .min(1, "RoleId is required"),

  region: z
    .enum(["in", "uk"])
    .refine(
      (val) => ["in", "uk"].includes(val),
      "Region must be either 'in' or 'uk'"
    ),
});

/* =========================
   Optional String Helper
========================= */
const optionalString = z
  .string()
  .transform((val) => (val.trim() === "" ? undefined : val))
  .optional();

/* =========================
   Update Admin
========================= */
export const updateAdminSchema = z.object({
  name: optionalString.refine(
    (val) =>
      val === undefined || /^[A-Za-z\s]+$/.test(val),
    "Name can contain only letters and spaces"
  ),

  email: optionalString.refine(
    (val) =>
      val === undefined ||
      z.string().email().safeParse(val).success,
    "Invalid email address"
  ),

  roleId: optionalString.refine(
    (val) => val === undefined || val.length > 0,
    "RoleId cannot be empty"
  ),

  region: z
    .enum(["in", "uk"])
    .optional()
    .refine(
      (val) => val === undefined || ["in", "uk"].includes(val),
      "Region must be either 'in' or 'uk'"
    ),

  isActive: z.boolean().optional(),
});

/* =========================
   Activate / Deactivate
========================= */
export const adminStatusSchema = z.object({
  isActive: z.boolean(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});


export const verifyAdminOtpSchema = z.object({
  email: z
    .string()
    .email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits"),
});

export const resendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

