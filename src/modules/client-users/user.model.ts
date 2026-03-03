import mongoose from "mongoose";

export interface IUser {
  userId: string;
  email: string;
  phoneNumber?: string;
  otp: string | null;
  otpExpiresAt: Date | null;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
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
      sparse: true, // allows multiple null / missing values
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

export const User = mongoose.model<IUser>("User", userSchema);
