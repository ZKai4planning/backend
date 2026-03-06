import mongoose from "mongoose";

export interface IAdminProfile {
  profileId: string;
  userRefId: string;
  name: string;
  email: string;
  phoneNumber: string;
  profilePicture: string;
}

const adminProfileSchema = new mongoose.Schema<IAdminProfile>(
  {
    profileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userRefId: {
      type: String,
      required: true,
      unique: true,
      ref: "AdminUser",
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
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    profilePicture: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export const AdminProfile = mongoose.model<IAdminProfile>(
  "AdminProfile",
  adminProfileSchema
);
