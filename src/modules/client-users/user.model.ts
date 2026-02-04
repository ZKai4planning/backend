import mongoose from "mongoose";

export interface IUser {
  userId: string; // 👈 custom ID
  email: string;
  phoneNumber: string;
  otp: string | null;
otpExpiresAt: Date | null;
status: 0 | 1;


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
    },

    phoneNumber: {
      type: String,
      unique: true,
    },

    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    status: {
     type: Number,
  enum: [0, 1],
  default: 0, 
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
