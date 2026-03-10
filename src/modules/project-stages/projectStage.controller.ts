import { Request, Response } from "express";
import mongoose from "mongoose";
import { ProjectStage } from "./projectStage.model";
import { generateId } from "../../utils/generators";

/* -------------------------------- */
/* Utils */
/* -------------------------------- */

const toBool = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (["true", "1", "yes"].includes(v)) return true;
    if (["false", "0", "no"].includes(v)) return false;
  }

  return fallback;
};

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const formatMongooseValidationErrors = (error: any) => {
  const errors: Record<string, string> = {};

  if (!error?.errors) return errors;

  Object.keys(error.errors).forEach((key) => {
    const message = error.errors[key]?.message;
    if (typeof message === "string") errors[key] = message;
  });

  return errors;
};

/* -------------------------------- */
/* CREATE PROJECT STAGE */
/* -------------------------------- */

export const createProjectStage = async (req: Request, res: Response) => {
  try {
    const {
      label,
      route,
      icon,
      priority,
      initialStage,
      status,
      legacyRoutes,
      nextCard
    } = req.body;

    const stageLabel = normalizeText(label);
    const stageRoute = normalizeText(route);

    if (!stageLabel || !stageRoute || !priority) {
      return res.status(400).json({
        success: false,
        message: "label, route and priority are required"
      });
    }

    const existingStage = await ProjectStage.findOne({
      $or: [{ label: stageLabel }, { route: stageRoute }, { priority }]
    });

    if (existingStage) {
      return res.status(409).json({
        success: false,
        message: "Stage with same label, route or priority already exists"
      });
    }

    const stage = await ProjectStage.create({
      stageId: generateId(),
      label: stageLabel,
      route: stageRoute,
      icon: normalizeText(icon),
      priority,
      legacyRoutes: legacyRoutes || [],
      nextCard: nextCard || null,
      initialStage: toBool(initialStage, false),
      status: toBool(status, true)
    });

    return res.status(201).json({
      success: true,
      message: "Project stage created successfully",
      data: stage
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate stage already exists"
      });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatMongooseValidationErrors(error)
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create stage"
    });
  }
};

/* -------------------------------- */
/* UPDATE PROJECT STAGE */
/* -------------------------------- */

export const updateProjectStage = async (req: Request, res: Response) => {
  try {
    const { stageId } = req.params;

    const stage = await ProjectStage.findOne({ stageId });

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Stage not found"
      });
    }

    const {
      label,
      route,
      icon,
      priority,
      initialStage,
      status,
      legacyRoutes,
      nextCard
    } = req.body;

    const updatePayload: any = {};

    if (label !== undefined) updatePayload.label = normalizeText(label);
    if (route !== undefined) updatePayload.route = normalizeText(route);
    if (icon !== undefined) updatePayload.icon = normalizeText(icon);
    if (priority !== undefined) updatePayload.priority = priority;
    if (legacyRoutes !== undefined) updatePayload.legacyRoutes = legacyRoutes;
    if (nextCard !== undefined) updatePayload.nextCard = nextCard;

    if (initialStage !== undefined)
      updatePayload.initialStage = toBool(initialStage, stage.initialStage);

    if (status !== undefined)
      updatePayload.status = toBool(status, stage.status);

    const updatedStage = await ProjectStage.findOneAndUpdate(
      { stageId },
      updatePayload,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Project stage updated successfully",
      data: updatedStage
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatMongooseValidationErrors(error)
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update stage"
    });
  }
};

/* -------------------------------- */
/* GET ALL STAGES */
/* -------------------------------- */

export const getProjectStageList = async (req: Request, res: Response) => {
  try {

    const includeDeleted = req.query.includeDeleted === "true";

    const filter = includeDeleted ? {} : { status: true };

    const stages = await ProjectStage.find(filter)
      .sort({ priority: 1 })
      .lean();

    const formattedStages = stages.map((stage: any) => ({
      stageId: stage.stageId,
      label: stage.label,
      route: stage.route,
      legacyRoutes: stage.legacyRoutes || [],
      icon: stage.icon || "",
      priority: stage.priority,
      initialStage: stage.initialStage,
      nextCard: stage.nextCard || null,
      status: stage.status,
      createdAt: stage.createdAt,
      updatedAt: stage.updatedAt
    }));

    return res.status(200).json({
      success: true,
      message: "Project stages fetched successfully",
      data: formattedStages
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project stages"
    });

  }
};

/* -------------------------------- */
/* GET STAGE DETAILS */
/* -------------------------------- */

export const getProjectStageDetails = async (req: Request, res: Response) => {
  try {
    const { stageId } = req.params;

    const stage = await ProjectStage.findOne({ stageId }).lean();

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Stage not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stage fetched successfully",
      data: stage
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch stage"
    });
  }
};

/* -------------------------------- */
/* SOFT DELETE */
/* -------------------------------- */

export const softDeleteProjectStage = async (req: Request, res: Response) => {
  try {
    const { stageId } = req.params;

    const stage = await ProjectStage.findOne({ stageId });

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Stage not found"
      });
    }

    stage.status = false;

    await stage.save();

    return res.status(200).json({
      success: true,
      message: "Stage disabled successfully"
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete stage"
    });
  }
};

/* -------------------------------- */
/* RESTORE STAGE */
/* -------------------------------- */

export const restoreProjectStage = async (req: Request, res: Response) => {
  try {
    const { stageId } = req.params;

    const stage = await ProjectStage.findOne({ stageId });

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Stage not found"
      });
    }

    stage.status = true;

    await stage.save();

    return res.status(200).json({
      success: true,
      message: "Stage restored successfully"
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to restore stage"
    });
  }
};

/* -------------------------------- */
/* PERMANENT DELETE */
/* -------------------------------- */

export const permanentlyDeleteProjectStage = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();

  try {
    const { stageId } = req.params;

    session.startTransaction();

    const stage = await ProjectStage.findOne({ stageId }).session(session);

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Stage not found"
      });
    }

    await ProjectStage.deleteOne({ _id: stage._id }).session(session);

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Stage permanently deleted"
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete stage"
    });
  } finally {
    session.endSession();
  }
};

/* -------------------------------- */
/* GET INITIAL STAGE */
/* -------------------------------- */

export const getInitialProjectStages = async (req: Request, res: Response) => {
  try {

    const stages = await ProjectStage.find({ initialStage: true, status: true })
      .sort({ priority: 1 })
      .lean();

    const formattedStages = stages.map((stage: any) => ({
      stageId: stage.stageId,
      label: stage.label,
      route: stage.route,
      legacyRoutes: stage.legacyRoutes || [],
      icon: stage.icon || "",
      priority: stage.priority,
      initialStage: stage.initialStage,
      nextCard: stage.nextCard || null,
      status: stage.status,
      createdAt: stage.createdAt,
      updatedAt: stage.updatedAt
    }));

    return res.status(200).json({
      success: true,
      message: "Initial project stages fetched successfully",
      data: formattedStages
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch initial stages"
    });

  }
};
