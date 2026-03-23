import mongoose, { InferSchemaType } from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    roleId: {
      type: String,
      required: true,
    },

    region: {
      type: String,
      enum: ["in", "uk"],
      required: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    oldPassword: {
      type: String,
      select: false,
    },

    passwordStatus: {
      type: Number,
      enum: [-1, 0, 1],
      default: -1,
    },

    passwordExpireFlag: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },

    resetPasswordStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },

    otp: {
      type: String,
      default: null,
      select: false,
    },

    otpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

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
  },
  { timestamps: true }
);

export type IEmployee = InferSchemaType<typeof employeeSchema>;

export const Employee = mongoose.model<IEmployee>("Employee", employeeSchema);
