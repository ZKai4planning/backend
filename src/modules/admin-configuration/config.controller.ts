import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Configuration } from "./config.model";
import {
  uploadSingleImage,
  removeCloudinaryImage,
} from "../../utils/cloudinary.util";
import { validatePasswordPolicy } from "../../utils/validators";

const SALT_ROUNDS = 10;

/* -------------------------------- */
/* Create Configuration */
/* -------------------------------- */

export const createConfiguration = async (req: Request, res: Response) => {
  try {
    const { defaultPassword } = req.body;

    const existing = await Configuration.findOne();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Configuration already exists",
      });
    }

    if (!defaultPassword) {
      return res.status(400).json({
        success: false,
        message: "Default password is required",
      });
    }

    /* Password policy validation */

    const validation = validatePasswordPolicy(defaultPassword);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Password policy failed",
        errors: validation.errors,
      });
    }

    /* Hash password */

    const hashed = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

    /* Upload logo */

    let logoUrl = "";

    if (req.file) {
      logoUrl = await uploadSingleImage(req.file, "config");
    }

    const config = await Configuration.create({
      defaultPassword: hashed,
      plainDefaultPassword: defaultPassword,
      logoUrl,
    });

    res.status(201).json({
      success: true,
      message: "Configuration created successfully",
      data: config,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create configuration",
    });
  }
};

/* -------------------------------- */
/* Get Configuration */
/* -------------------------------- */

export const getConfiguration = async (req: Request, res: Response) => {
  try {
    const config = await Configuration.getConfig();

    res.json({
      success: true,
      data: {
        defaultPassword: config.plainDefaultPassword,
        logoUrl: config.logoUrl,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch configuration",
    });
  }
};

/* -------------------------------- */
/* Update Configuration */
/* -------------------------------- */

export const updateConfiguration = async (req: Request, res: Response) => {
  try {
    const { defaultPassword } = req.body;

    const config = await Configuration.getConfig();

    /* Update password */

    if (defaultPassword) {
      const validation = validatePasswordPolicy(defaultPassword);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: "Password policy failed",
          errors: validation.errors,
        });
      }

      const hashed = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

      config.defaultPassword = hashed;
      config.plainDefaultPassword = defaultPassword;
    }

    /* Upload new logo */

    if (req.file) {
      const logoUrl = await uploadSingleImage(req.file, "config");

      if (logoUrl) {
        /* Remove old logo */
        if (config.logoUrl) {
          await removeCloudinaryImage(config.logoUrl);
        }

        config.logoUrl = logoUrl;
      }
    }

    await config.save();

    res.json({
      success: true,
      message: "Configuration updated successfully",
      data: config,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update configuration",
    });
  }
};