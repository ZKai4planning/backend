import { Request, Response } from "express";

import cloudinary from "../../config/cloudinary";
import { UserProfile } from "./userprofile.model";




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
    const { fullName, bio } = req.body;

    const profile = await UserProfile.findOneAndUpdate(
      { userRefId: userId },
      { fullName, bio },
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