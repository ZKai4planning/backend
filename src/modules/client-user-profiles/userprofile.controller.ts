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

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const profile = await UserProfile.findOne({ userRefId: userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
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
          message: "Name is required."
        });
      }
      userUpdateFields.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      if (typeof phoneNumber !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone number must be a string"
        });
      }
      userUpdateFields.phoneNumber = phoneNumber.trim();
    }

    if (council !== undefined) {
      if (typeof council !== "string") {
        return res.status(400).json({
          success: false,
          message: "Council must be a string"
        });
      }
      updateFields.council = council.trim();
    }

    /* ---------- Phone ---------- */

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

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
      { new: true, runValidators: true, upsert: true } // Added upsert for safety
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
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
      data: {"profilePicture": profile.profilePicture}
    });

  } catch (error) {
    console.error("Profile Picture Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ------------------------------------------------ */
/* User Profile Status Percentage */
/* ------------------------------------------------ */
export const getUserProfileStatusByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = String(req.params.userId);

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let profile = await UserProfile.findOne({ userRefId: userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // ✅ Weighted calculation
    let completion = 0;
    let completedFields = 0;
    const totalFields = 13;

    const status = {
      fullName: false,
      phoneNumber: false,
      phone: false,
      council: false,
      landline: false,
      profilePicture: false,
      address: {
        doorNo: false,
        street: false,
        locality: false,
        city: false,
        state: false,
        country: false,
        postalCode: false,
      },
    };

    // ---------- User fields ----------
    if (user.fullName) {
      completion += 10;
      completedFields++;
      status.fullName = true;
    }

    if (user.phoneNumber) {
      completion += 10;
      completedFields++;
      status.phoneNumber = true;
    }

    // ---------- Profile fields ----------
    if (profile.phone?.countryCode && profile.phone?.number) {
      completion += 15;
      completedFields++;
      status.phone = true;
    }

    if (profile.council) {
      completion += 10;
      completedFields++;
      status.council = true;
    }

    if (profile.landline?.number) {
      completion += 5;
      completedFields++;
      status.landline = true;
    }

    if (profile.profilePicture) {
      completion += 10;
      completedFields++;
      status.profilePicture = true;
    }

    // ---------- Address ----------
    const addr = profile.address;

    if (addr?.doorNo) {
      completion += 5;
      completedFields++;
      status.address.doorNo = true;
    }

    if (addr?.street) {
      completion += 5;
      completedFields++;
      status.address.street = true;
    }

    if (addr?.locality) {
      completion += 5;
      completedFields++;
      status.address.locality = true;
    }

    if (addr?.city) {
      completion += 10;
      completedFields++;
      status.address.city = true;
    }

    if (addr?.state) {
      completion += 5;
      completedFields++;
      status.address.state = true;
    }

    if (addr?.country) {
      completion += 5;
      completedFields++;
      status.address.country = true;
    }

    if (addr?.postalCode) {
      completion += 5;
      completedFields++;
      status.address.postalCode = true;
    }

    return res.status(200).json({
      success: true,
      data: {
        userId,
        completionPercentage: completion,
        completedFields,
        totalFields,
        status,
      },
    });
  } catch (error) {
    console.error("User Profile Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
