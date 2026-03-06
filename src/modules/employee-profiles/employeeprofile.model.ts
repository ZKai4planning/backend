import mongoose from "mongoose";

export interface IEmployeeProfile {
  profileId: string;
  userRefId: string;
  name: string;
  email: string;
  phoneNumber: string;
  profilePicture: string;
}

const employeeProfileSchema = new mongoose.Schema<IEmployeeProfile>(
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
      ref: "Employee",
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

export const EmployeeProfile = mongoose.model<IEmployeeProfile>(
  "EmployeeProfile",
  employeeProfileSchema
);
