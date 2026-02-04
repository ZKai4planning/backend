import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Configuration } from "./config.model"; // adjust path

const SALT_ROUNDS = 10;

// Create configuration (only if none exists)
export const createConfiguration = async (req: Request, res: Response) => {
  try {
    const { defaultPassword, logoUrl } = req.body;

    // Check if configuration already exists
    const existingConfig = await Configuration.findOne();
    if (existingConfig) {
      return res
        .status(400)
        .json({ message: "Configuration already exists. Use update instead." });
    }

    let hashedPassword = "";
    if (defaultPassword) {
      hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
    }

    const config = await Configuration.create({
      defaultPassword: hashedPassword,
      plainDefaultPassword: defaultPassword || "",
      logoUrl: logoUrl || "",
    });

    res.status(201).json({ message: "Configuration created successfully", config });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get configuration
export const getConfiguration = async (req: Request, res: Response) => {
  try {
    const config = await Configuration.findOne();
    if (!config) return res.status(404).json({ message: "No configuration found" });

    res.json({
      logoUrl: config.logoUrl,
      defaultPassword: config.plainDefaultPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update configuration
export const updateConfiguration = async (req: Request, res: Response) => {
  try {
    const { defaultPassword, logoUrl } = req.body;

    const config = await Configuration.findOne();
    if (!config) return res.status(404).json({ message: "No configuration found" });

    if (defaultPassword) {
      const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
      config.defaultPassword = hashedPassword;
      config.plainDefaultPassword = defaultPassword;
    }

    if (logoUrl) config.logoUrl = logoUrl;

    await config.save();

    res.json({ message: "Configuration updated successfully", config });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
