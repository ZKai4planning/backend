import mongoose, { InferSchemaType } from "mongoose";

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
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    fullName: {
      type: String,
      trim: true,
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
