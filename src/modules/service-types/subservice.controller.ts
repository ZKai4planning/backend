import { Request, Response } from "express";
import mongoose from "mongoose";
import fs from "fs/promises";
import cloudinary from "../../config/cloudinary";
import { generateId } from "../../utils/generators";
import { Service } from "./service.model";
import { SubService } from "./subservice.model";

/* -------------------------------- */
/* Response Helpers */
/* -------------------------------- */

const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown
) => res.status(statusCode).json({ success: true, message, data });

const sendError = (res: Response, statusCode: number, message: string) =>
  res.status(statusCode).json({ success: false, message });

/* -------------------------------- */
/* Utils */
/* -------------------------------- */

const toBool = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
};

const cleanupTempFiles = async (files: Express.Multer.File[] = []) => {
  await Promise.all(
    files.map((file) => fs.unlink(file.path).catch(() => undefined))
  );
};

const uploadImages = async (files: Express.Multer.File[]) => {
  if (!files?.length) return [];

  const uploads = await Promise.all(
    files.map((file) =>
      cloudinary.uploader.upload(file.path, { folder: "subservices" })
    )
  );

  return uploads.map((img) => img.secure_url);
};

const extractPublicId = (url: string) => {
  try {
    const parts = url.split("/");
    const file = parts.pop();
    const folder = parts.pop();
    return `${folder}/${file?.split(".")[0]}`;
  } catch {
    return null;
  }
};

const removeImagesFromCloudinary = async (images: string[]) => {
  await Promise.all(
    images.map(async (url) => {
      const publicId = extractPublicId(url);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    })
  );
};

/* -------------------------------- */
/* CREATE SUBSERVICE */
/* -------------------------------- */

export const createSubService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  try {
    const { serviceId, title, subServiceName, description, status } = req.body;

    if (!serviceId || !title || !subServiceName || !description)
      return sendError(res, 400, "Required fields missing");

    const service = await Service.findOne({ serviceId });
    if (!service) return sendError(res, 404, "Parent service not found");

    const imageUrls = await uploadImages(files);

    const subService = await SubService.create({
      subServiceId: generateId(),
      service: service._id,
      title,
      subServiceName: subServiceName,
      description,
      images: imageUrls,
      status: toBool(status, true)
    });

    /* link to parent service */

    service.subServices.push(subService._id);
    await service.save();

    return sendSuccess(res, 201, "Subservice created successfully", subService);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to create subservice");
  } finally {
    await cleanupTempFiles(files);
  }
};

/* -------------------------------- */
/* UPDATE SUBSERVICE */
/* -------------------------------- */

export const updateSubService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  try {
    const { subServiceId } = req.params;
    const { title, subServiceName, description, status } = req.body;

    const subService = await SubService.findOne({ subServiceId });

    if (!subService) return sendError(res, 404, "Subservice not found");

    const newImages = await uploadImages(files);

    const updatePayload: Partial<typeof subService> = {
      images: [...subService.images, ...newImages]
    };

    if (title) updatePayload.title = title;
    if (subServiceName) updatePayload.subServiceName = subServiceName;
    if (description) updatePayload.description = description;
    if (status !== undefined)
      updatePayload.status = toBool(status, subService.status);

    const updated = await SubService.findOneAndUpdate(
      { subServiceId },
      updatePayload,
      { new: true }
    );

    return sendSuccess(res, 200, "Subservice updated successfully", updated);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to update subservice");
  } finally {
    await cleanupTempFiles(files);
  }
};

/* -------------------------------- */
/* GET SUBSERVICES BY SERVICE */
/* -------------------------------- */

export const getSubServicesByService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const includeDeleted = req.query.includeDeleted === "true";

    const service = await Service.findOne({ serviceId, status: !includeDeleted } );

    if (!service) return sendError(res, 404, "Service not found");

    const subservices = await SubService.find({ service: service._id, status: !includeDeleted });

    return sendSuccess(res, 200, "Subservices fetched successfully", subservices);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to fetch subservices");
  }
};

/* -------------------------------- */
/* SUBSERVICE DETAILS */
/* -------------------------------- */

export const getSubServiceDetails = async (req: Request, res: Response) => {
  try {
    const { subServiceId } = req.params;
    const includeDeleted = req.query.includeDeleted === "true";

    const subService = await SubService.findOne({ subServiceId, status: !includeDeleted }).populate(
      "service",
      "serviceId title subServiceName"
    );

    if (!subService) return sendError(res, 404, "Subservice not found");

    return sendSuccess(res, 200, "Subservice fetched successfully", subService);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to fetch subservice");
  }
};

/* -------------------------------- */
/* SOFT DELETE */
/* -------------------------------- */

export const softDeleteSubService = async (req: Request, res: Response) => {
  try {
    const { subServiceId } = req.params;

    const subService = await SubService.findOne({
      subServiceId,
    });

    if (!subService) return sendError(res, 404, "Subservice not found");

    subService.status = false;

    await subService.save();

    return sendSuccess(res, 200, "Subservice soft deleted successfully");
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to soft delete subservice");
  }
};

/* -------------------------------- */
/* RESTORE */
/* -------------------------------- */

export const restoreSubService = async (req: Request, res: Response) => {
  try {
    const { subServiceId } = req.params;

    const subService = await SubService.findOne({
      subServiceId,
    });

    if (!subService) return sendError(res, 404, "Deleted subservice not found");

    subService.status = true;

    await subService.save();

    return sendSuccess(res, 200, "Subservice restored successfully");
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to restore subservice");
  }
};

/* -------------------------------- */
/* PERMANENT DELETE */
/* -------------------------------- */

export const permanentlyDeleteSubService = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();

  try {
    const { subServiceId } = req.params;

    session.startTransaction();

    const subService = await SubService.findOne({ subServiceId }).session(
      session
    );

    if (!subService) return sendError(res, 404, "Subservice not found");

    await removeImagesFromCloudinary(subService.images);

    await Service.updateOne(
      { _id: subService.service },
      { $pull: { subServices: subService._id } }
    ).session(session);

    await SubService.deleteOne({ _id: subService._id }).session(session);

    await session.commitTransaction();

    return sendSuccess(res, 200, "Subservice permanently deleted");
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return sendError(res, 500, "Failed to delete subservice");
  } finally {
    session.endSession();
  }
};

/* -------------------------------- */
/* REMOVE SUB SERVICE IMAGES */
/* -------------------------------- */
export const removeSubServiceImages = async (req: Request, res: Response) => {
  try {
    const { subServiceId } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return sendError(res, 400, "Images array is required");
    }

    const subService = await SubService.findOne({
      subServiceId
    });

    if (!subService) {
      return sendError(res, 404, "Subservice not found");
    }

    /* Only remove images that actually belong to this subservice */

    const imagesToRemove = subService.images.filter((img) =>
      images.includes(img)
    );

    if (!imagesToRemove.length) {
      return sendError(res, 400, "No matching images found to remove");
    }

    /* Remove from Cloudinary */

    await removeImagesFromCloudinary(imagesToRemove);

    /* Update database */

    subService.images = subService.images.filter(
      (img) => !imagesToRemove.includes(img)
    );

    await subService.save();

    return sendSuccess(
      res,
      200,
      "Subservice images removed successfully",
      {
        removedImages: imagesToRemove,
        images: subService.images
      }
    );
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to remove subservice images");
  }
};
