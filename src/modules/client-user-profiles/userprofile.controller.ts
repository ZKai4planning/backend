import { Request, Response } from "express";

import cloudinary from "../../config/cloudinary";
import { UserProfile } from "./userprofile.model";
import { isValidUrl } from "../../utils/validators";




export const getProfileByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const profile = await UserProfile.findOne({ userRefId: userId });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfileByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { fullName, bio, profilePicture } = req.body as {
      fullName?: unknown;
      bio?: unknown;
      profilePicture?: unknown;
    };

    const updateFields: {
      fullName?: string;
      bio?: string;
      profilePicture?: string;
    } = {};

    if (fullName !== undefined) {
      if (typeof fullName !== "string") {
        return res.status(400).json({ message: "`fullName` must be a string" });
      }
      updateFields.fullName = fullName.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string") {
        return res.status(400).json({ message: "`bio` must be a string" });
      }
      updateFields.bio = bio.trim();
    }

    if (profilePicture !== undefined) {
      if (
        profilePicture === null ||
        (typeof profilePicture === "string" && profilePicture.trim() === "")
      ) {
        updateFields.profilePicture = "";
      } else if (
        typeof profilePicture !== "string" ||
        !isValidUrl(profilePicture.trim())
      ) {
        return res.status(400).json({
          message: "`profilePicture` must be a valid http/https URL",
        });
      } else {
        updateFields.profilePicture = profilePicture.trim();
      }
    }

    if (!Object.keys(updateFields).length) {
      return res.status(400).json({
        message: "Provide at least one of: fullName, bio, profilePicture",
      });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userRefId: userId },
      { $set: updateFields },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ message: "Profile updated successfully", profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateProfilePictureByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile_pictures",
    });

    // Save URL to MongoDB
    const profile = await UserProfile.findOneAndUpdate(
      { userRefId: userId },
      { profilePicture: result.secure_url },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      message: "Profile picture updated successfully",
      profile,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
