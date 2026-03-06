import { Request, Response } from "express";
import { generateId } from "../../utils/generators";
import {
  isValidEmail,
  isValidInternationalPhone,
} from "../../utils/validators";
import cloudinary from "../../config/cloudinary";
import { AdminUser } from "../admin-users/adminuser.model";
import { AdminProfile } from "./adminprofile.model";

const generateUniqueProfileId = async (): Promise<string> => {
  let profileId = generateId();
  while (await AdminProfile.findOne({ profileId })) {
    profileId = generateId();
  }
  return profileId;
};

export const upsertAdminProfile = async ({
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
  const existing = await AdminProfile.findOne({ userRefId: userId });

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

    return AdminProfile.findOneAndUpdate(
      { userRefId: userId },
      { $set: updateFields },
      { new: true }
    );
  }

  const profileId = await generateUniqueProfileId();

  return AdminProfile.create({
    profileId,
    userRefId: userId,
    name: name.trim(),
    email: normalizedEmail,
    phoneNumber: phoneNumber?.trim() ?? "",
    profilePicture: profilePicture?.trim() ?? "",
  });
};

export const getAdminProfileByUserId = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const admin = await AdminUser.findOne({ userId });

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    let profile = await AdminProfile.findOne({ userRefId: userId });
    if (!profile) {
      profile = await upsertAdminProfile({
        userId: admin.userId,
        name: admin.name,
        email: admin.email,
        phoneNumber: "",
        profilePicture: "",
      });
    }

    return res.json(profile);
  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAdminProfileByUserId = async (req: Request, res: Response) => {
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
    const adminUpdates: {
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
      adminUpdates.name = trimmedName;
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !isValidEmail(email.trim())) {
        return res.status(400).json({ message: "`email` is invalid" });
      }
      const normalizedEmail = email.trim().toLowerCase();
      profileUpdates.email = normalizedEmail;
      adminUpdates.email = normalizedEmail;
    }

    if (phoneNumber !== undefined) {
      if (
        typeof phoneNumber !== "string" ||
        !isValidInternationalPhone(phoneNumber)
      ) {
        return res.status(400).json({
          message: "`phoneNumber` must be a valid international phone number",
        });
      }
      profileUpdates.phoneNumber = phoneNumber.trim();
    }

    if (!Object.keys(profileUpdates).length) {
      return res.status(400).json({
        message: "Provide at least one of: name, email, phoneNumber",
      });
    }

    const admin = await AdminUser.findOne({ userId });
    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    if (
      adminUpdates.email &&
      adminUpdates.email !== admin.email &&
      (await AdminUser.findOne({
        email: adminUpdates.email,
        userId: { $ne: userId },
      }))
    ) {
      return res.status(400).json({ message: "Email already in use" });
    }

    if (Object.keys(adminUpdates).length) {
      await AdminUser.updateOne({ userId }, { $set: adminUpdates });
    }

    const profile = await upsertAdminProfile({
      userId,
      name: adminUpdates.name ?? admin.name,
      email: adminUpdates.email ?? admin.email,
      phoneNumber: profileUpdates.phoneNumber,
    });

    return res.json({
      message: "Admin profile updated successfully",
      profile,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    console.error("Update Admin Profile Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAdminProfilePictureByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = String(req.params.userId);
    const admin = await AdminUser.findOne({ userId });

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "admin_profile_pictures",
    });

    const profile = await upsertAdminProfile({
      userId: admin.userId,
      name: admin.name,
      email: admin.email,
      profilePicture: uploadResult.secure_url,
    });

    return res.json({
      message: "Admin profile picture updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update Admin Profile Picture Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAdminProfilePictureByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = String(req.params.userId);
    const admin = await AdminUser.findOne({ userId });

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    const profile = await AdminProfile.findOne({ userRefId: userId });
    if (!profile || !profile.profilePicture) {
      return res.status(404).json({ message: "Admin profile picture not found" });
    }

    return res.json({
      userId,
      profilePicture: profile.profilePicture,
    });
  } catch (error) {
    console.error("Get Admin Profile Picture Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
