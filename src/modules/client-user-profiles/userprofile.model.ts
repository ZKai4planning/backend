import mongoose from "mongoose";

export interface IUserProfile {
  profileId: string;
  userRefId: string; // 👈 references User.userId
  fullName?: string;
  profilePicture?: string;
  bio?: string;
}

const userProfileSchema = new mongoose.Schema<IUserProfile>(
  {
    profileId: {
      type: String,
      required: true,
      unique: true
    },

    userRefId: {
      type: String,
      required: true,
      ref: "User" // still keeps logical relationship
    },

    fullName: String,
    profilePicture: String,
    bio: String
  },
  { timestamps: true }
);

export const UserProfile = mongoose.model<IUserProfile>(
  "UserProfile",
  userProfileSchema
);
