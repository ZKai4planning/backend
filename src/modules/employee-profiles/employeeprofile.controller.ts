import { Request, Response } from "express";
import { generateId } from "../../utils/generators";
import {
  isValidEmail,
  isValidIndiaUKPhoneNumber,
} from "../../utils/validators";
import cloudinary from "../../config/cloudinary";
import { Employee } from "../employee-users/employee.model";
import { EmployeeProfile } from "./employeeprofile.model";

const generateUniqueProfileId = async (): Promise<string> => {
  let profileId = generateId();
  while (await EmployeeProfile.findOne({ profileId })) {
    profileId = generateId();
  }
  return profileId;
};

export const upsertEmployeeProfile = async ({
  userId,
  name,
  email,
  phoneNumber,
  profilePicture,
}: {
  userId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await EmployeeProfile.findOne({ userRefId: userId });

  if (existing) {
    const updateFields: {
      name: string;
      email: string;
      phoneNumber?: string;
      profilePicture?: string;
    } = {
      name: name.trim(),
      email: normalizedEmail,
    };

    if (phoneNumber !== undefined) {
      updateFields.phoneNumber = phoneNumber.trim();
    }
    if (profilePicture !== undefined) {
      updateFields.profilePicture = profilePicture.trim();
    }

    return EmployeeProfile.findOneAndUpdate(
      { userRefId: userId },
      { $set: updateFields },
      { new: true }
    );
  }

  const profileId = await generateUniqueProfileId();

  return EmployeeProfile.create({
    profileId,
    userRefId: userId,
    name: name.trim(),
    email: normalizedEmail,
    phoneNumber: phoneNumber?.trim() ?? "",
    profilePicture: profilePicture?.trim() ?? "",
  });
};

export const getEmployeeProfileByUserId = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    let profile = await EmployeeProfile.findOne({ userRefId: userId });
    if (!profile) {
      profile = await upsertEmployeeProfile({
        userId: employee.userId,
        name: employee.name,
        email: employee.email,
        phoneNumber: "",
        profilePicture: "",
      });
    }

    return res.json(profile);
  } catch (error) {
    console.error("Get Employee Profile Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateEmployeeProfileByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = String(req.params.userId);
    const { name, email, phoneNumber } = req.body as {
      name?: unknown;
      email?: unknown;
      phoneNumber?: unknown;
    };

    const profileUpdates: {
      name?: string;
      email?: string;
      phoneNumber?: string;
    } = {};
    const employeeUpdates: {
      name?: string;
      email?: string;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !/^[A-Za-z ]{2,50}$/.test(name.trim())) {
        return res.status(400).json({
          message:
            "`name` must be a string with 2-50 letters/spaces only",
        });
      }
      const trimmedName = name.trim();
      profileUpdates.name = trimmedName;
      employeeUpdates.name = trimmedName;
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !isValidEmail(email.trim())) {
        return res.status(400).json({ message: "`email` is invalid" });
      }
      const normalizedEmail = email.trim().toLowerCase();
      profileUpdates.email = normalizedEmail;
      employeeUpdates.email = normalizedEmail;
    }

    if (phoneNumber !== undefined) {
      if (
        typeof phoneNumber !== "string" ||
        !isValidIndiaUKPhoneNumber(phoneNumber)
      ) {
        return res.status(400).json({
          message: "`phoneNumber` must be a valid Indian or UK phone number",
        });
      }
      profileUpdates.phoneNumber = phoneNumber.trim();
    }

    if (!Object.keys(profileUpdates).length) {
      return res.status(400).json({
        message: "Provide at least one of: name, email, phoneNumber",
      });
    }

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    if (
      employeeUpdates.email &&
      employeeUpdates.email !== employee.email &&
      (await Employee.findOne({
        email: employeeUpdates.email,
        userId: { $ne: userId },
      }))
    ) {
      return res.status(400).json({ message: "Email already in use" });
    }

    if (Object.keys(employeeUpdates).length) {
      await Employee.updateOne({ userId }, { $set: employeeUpdates });
    }

    const profile = await upsertEmployeeProfile({
      userId,
      name: employeeUpdates.name ?? employee.name,
      email: employeeUpdates.email ?? employee.email,
      phoneNumber: profileUpdates.phoneNumber,
    });

    return res.json({
      message: "Employee profile updated successfully",
      profile,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    console.error("Update Employee Profile Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateEmployeeProfilePictureByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = String(req.params.userId);
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "employee_profile_pictures",
    });

    const profile = await upsertEmployeeProfile({
      userId: employee.userId,
      name: employee.name,
      email: employee.email,
      profilePicture: uploadResult.secure_url,
    });

    return res.json({
      message: "Employee profile picture updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update Employee Profile Picture Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeProfilePictureByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = String(req.params.userId);
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    const profile = await EmployeeProfile.findOne({ userRefId: userId });
    if (!profile || !profile.profilePicture) {
      return res
        .status(404)
        .json({ message: "Employee profile picture not found" });
    }

    return res.json({
      userId,
      profilePicture: profile.profilePicture,
    });
  } catch (error) {
    console.error("Get Employee Profile Picture Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeProfileStatusByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = String(req.params.userId);

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ message: "Employee user not found" });
    }

    let profile = await EmployeeProfile.findOne({ userRefId: userId });

    // If profile doesn't exist → create default
    if (!profile) {
      profile = await upsertEmployeeProfile({
        userId: employee.userId,
        name: employee.name,
        email: employee.email,
        phoneNumber: "",
        profilePicture: "",
      });
    }

    // Final safety check (for TS + runtime safety)
    if (!profile) {
      return res.status(500).json({ message: "Failed to create profile" });
    }

    // Completion logic
    let totalFields = 4;
    let completedFields = 0;

    const fieldStatus = {
      name: false,
      email: false,
      phoneNumber: false,
      profilePicture: false,
    };

    if (profile.name) {
      completedFields++;
      fieldStatus.name = true;
    }

    if (profile.email) {
      completedFields++;
      fieldStatus.email = true;
    }

    if (profile.phoneNumber) {
      completedFields++;
      fieldStatus.phoneNumber = true;
    }

    if (profile.profilePicture) {
      completedFields++;
      fieldStatus.profilePicture = true;
    }

    const completionPercentage = Math.round(
      (completedFields / totalFields) * 100
    );

    return res.json({
      userId,
      completionPercentage,
      completedFields,
      totalFields,
      fieldStatus,
    });
  } catch (error) {
    console.error("Get Profile Status Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
