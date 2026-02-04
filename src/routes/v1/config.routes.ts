import express from "express";
import { createConfiguration, getConfiguration, updateConfiguration } from "../../modules/admin-configuration/config.controller";


const router = express.Router();

// Create configuration (only if none exists)
router.post("/", createConfiguration);

// Fetch configuration
router.get("/", getConfiguration);

// Update configuration
router.put("/", updateConfiguration);

export default router;
