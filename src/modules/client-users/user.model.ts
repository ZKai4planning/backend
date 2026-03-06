import mongoose, { InferSchemaType } from "mongoose";

/* ---------- Regex Helpers ---------- */

const NAME_REGEX = /^[A-Za-z\s.'-]+$/;
const PHONE_REGEX = /^[0-9]{6,15}$/;
const COUNTRY_CODE_REGEX = /^\+[1-9]{1,4}$/;
const POSTAL_REGEX = /^[A-Za-z0-9\s\-]{3,10}$/;
const NO_HTML_REGEX = /<[^>]*>/;

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    fullName: {
      type: String,
      trim: true,
      set: normalizeWhitespace,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
      match: [NAME_REGEX, "Full name contains invalid characters"],
      validate: {
        validator: (value: string) => !NO_HTML_REGEX.test(value),
        message: "Full name cannot contain HTML or script tags"
      },
      description: "Full name of the user displayed in the profile"
    },

    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    lastLoginAt: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema>;

export const User = mongoose.model<IUser>("User", userSchema);
