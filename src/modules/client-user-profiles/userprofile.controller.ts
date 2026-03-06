import { Request, Response } from "express";
import cloudinary from "../../config/cloudinary";
import { UserProfile } from "./userprofile.model";
import { isValidUrl } from "../../utils/validators";
import { User } from "../client-users/user.model";

/* ------------------------------------------------ */
/* Get Profile By UserId */
/* ------------------------------------------------ */

export const getProfileByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const profile = await UserProfile.findOne({ userRefId: userId }).lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: user.userId,
        profileId: profile.profileId,
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        phone: profile.phone,
        landline: profile.landline,
        council: profile.council,
        profilePicture: profile.profilePicture,
        bio: profile.bio,
        address: profile.address,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* ------------------------------------------------ */
/* Update Profile */
/* ------------------------------------------------ */

export const updateProfileByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const {
      fullName,
      phoneNumber,
      bio,
      council,
      phone,
      landline,
      address
    } = req.body;

    const updateFields: any = {};
    const userUpdateFields: any = {};

    /* ---------- Basic Fields ---------- */

    if (fullName !== undefined) {
      if (typeof fullName !== "string") {
        return res.status(400).json({
          success: false,
          message: "fullName must be a string"
        });
      }
      userUpdateFields.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      if (typeof phoneNumber !== "string") {
        return res.status(400).json({
          success: false,
          message: "phoneNumber must be a string"
        });
      }
      userUpdateFields.phoneNumber = phoneNumber.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string") {
        return res.status(400).json({
          success: false,
          message: "bio must be a string"
        });
      }
      updateFields.bio = bio.trim();
    }

    if (council !== undefined) {
      if (typeof council !== "string") {
        return res.status(400).json({
          success: false,
          message: "council must be a string"
        });
      }
      updateFields.council = council.trim();
    }

    /* ---------- Phone ---------- */

    if (phone) {
      if (
        typeof phone !== "object" ||
        typeof phone.countryCode !== "string" ||
        typeof phone.number !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone structure"
        });
      }

      updateFields.phone = {
        countryCode: phone.countryCode.trim(),
        number: phone.number.trim()
      };
    }

    /* ---------- Landline ---------- */

    if (landline) {
      if (
        typeof landline !== "object" ||
        typeof landline.number !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid landline structure"
        });
      }

      updateFields.landline = {
        countryCode: landline.countryCode?.trim(),
        number: landline.number.trim()
      };
    }

    /* ---------- Address ---------- */

    if (address) {
      if (typeof address !== "object") {
        return res.status(400).json({
          success: false,
          message: "Address must be an object"
        });
      }

      updateFields.address = {};

      const allowedFields = [
        "doorNo",
        "street",
        "locality",
        "city",
        "state",
        "country",
        "postalCode"
      ];

      for (const key of allowedFields) {
        if (address[key]) {
          updateFields.address[key] = String(address[key]).trim();
        }
      }
    }

    if (!Object.keys(updateFields).length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update"
      });
    }

    const user = await User.findOneAndUpdate(
      { userId: userId },
      { $set: userUpdateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userRefId: userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile
    });

  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* ------------------------------------------------ */
/* Update Profile Picture */
/* ------------------------------------------------ */

export const updateProfilePictureByUserId = async (
  req: Request,
  res: Response
) => {
  try {

    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    /* ---------- Upload Image ---------- */

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile_pictures"
    });

    const profile = await UserProfile.findOne({ userRefId: userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    /* ---------- Remove Old Image ---------- */

    if (profile.profilePicture && isValidUrl(profile.profilePicture)) {
      try {
        const publicId = profile.profilePicture
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];

        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn("Old image cleanup failed");
      }
    }

    profile.profilePicture = uploadResult.secure_url;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: profile
    });

  } catch (error) {
    console.error("Profile Picture Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};