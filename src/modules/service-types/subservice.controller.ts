import { Request, Response } from "express";
import mongoose from "mongoose";
import fs from "fs/promises";
import cloudinary from "../../config/cloudinary";
import { generateId } from "../../utils/generators";
import { Service } from "./service.model";
import { SubService } from "./subservice.model";

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
    files.map((file) => fs.unlink(file.path).catch(() => { }))
  );
};

/* -------------------------------- */
/* Cloudinary Helpers */
/* -------------------------------- */

const uploadImage = async (files: Express.Multer.File[]) => {
  if (!files?.length) return "";

  const upload = await cloudinary.uploader.upload(files[0].path, {
    folder: "subservices"
  });

  return upload.secure_url;
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

const removeImageFromCloudinary = async (image: string) => {
  if (!image) return;

  const publicId = extractPublicId(image);
  if (publicId) await cloudinary.uploader.destroy(publicId);
};

/* -------------------------------- */
/* CREATE SUBSERVICE */
/* -------------------------------- */

export const createSubService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ||
    (req.file ? [req.file] : []);

  try {
    const { serviceId, title, subServiceName, description, status } = req.body;

    if (!serviceId || !title || !subServiceName || !description)
      return res.status(400).json({ success: false, message: "Required fields missing" });

    const service = await Service.findOne({ serviceId });
    if (!service) return res.status(404).json({ success: false, message: "Parent service not found" });

    const imageUrl = await uploadImage(files);

    const subService = await SubService.create({
      subServiceId: generateId(),
      service: service._id,
      title,
      subServiceName,
      description,
      image: imageUrl,
      status: toBool(status, true)
    });

    /* link to parent service */

    service.subServices.push(subService._id);
    await service.save();

    return res.status(201).json({ success: true, message: "Subservice created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to create subservice" });
  } finally {
    await cleanupTempFiles(files);
  }
};

/* -------------------------------- */
/* UPDATE SUBSERVICE */
/* -------------------------------- */

export const updateSubService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ||
    (req.file ? [req.file] : []);

  try {
    const { subServiceId } = req.params;
    const { title, subServiceName, description, status } = req.body;

    const subService = await SubService.findOne({ subServiceId });

    if (!subService) return res.status(404).json({ success: false, message: "Subservice not found" });

    const newImage = await uploadImage(files);

    const updatePayload: any = {
      image: newImage || subService.image
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

    return res.status(200).json({ success: true, message: "Subservice updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to update subservice" });
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

    const service = await Service.findOne({ serviceId, ...(includeDeleted ? {} : { status: true }) });

    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    const subservices = await SubService.find({ service: service._id, ...(includeDeleted ? {} : { status: true }) });

    return res.status(200).json({ success: true, message: "Subservices fetched successfully", data: subservices });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch subservices" });
  }
};

/* -------------------------------- */
/* SUBSERVICE DETAILS */
/* -------------------------------- */

export const getSubServiceDetails = async (req: Request, res: Response) => {
  try {
    const { subServiceId } = req.params;
    const includeDeleted = req.query.includeDeleted === "true";

    const subService = await SubService.findOne({ subServiceId, ...(includeDeleted ? {} : { status: true }) }).populate(
      "service",
      "serviceId title subServiceName"
    );

    if (!subService) return res.status(404).json({ success: false, message: "Subservice not found" });

    return res.status(200).json({ success: true, message: "Subservice fetched successfully", data: subService });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch subservice" });
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

    if (!subService) return res.status(404).json({ success: false, message: "Subservice not found" });

    subService.status = false;

    await subService.save();

    return res.status(200).json({ success: true, message: "Subservice soft deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to soft delete subservice" });
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

    if (!subService) return res.status(404).json({ success: false, message: "Deleted subservice not found" });

    subService.status = true;

    await subService.save();

    return res.status(200).json({ success: true, message: "Subservice restored successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to restore subservice" });
  }
};

/* -------------------------------- */
/* PERMANENT DELETE */
/* -------------------------------- */

export const permanentlyDeleteSubService = async (
  req: Request,
  res: Response
) => {
  // const session = await mongoose.startSession();

  try {
    const { subServiceId } = req.params;

    // session.startTransaction();

    const subService = await SubService.findOne({ subServiceId });

    if (!subService) return res.status(404).json({ success: false, message: "Subservice not found" });

    await removeImageFromCloudinary(subService.image);

    await Service.updateOne(
      { _id: subService.service },
      { $pull: { subServices: subService._id } }
    );

    await SubService.deleteOne({ _id: subService._id });

    // await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Subservice permanently deleted" });
  } catch (error) {
    // await session.abortTransaction();
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to delete subservice" });
  }
};

/* -------------------------------- */
/* REMOVE SUB SERVICE IMAGE */
/* -------------------------------- */
export const removeSubServiceImage = async (req: Request, res: Response) => {
  try {
    const { subServiceId } = req.params;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const subService = await SubService.findOne({
      subServiceId
    });

    if (!subService) {
      return res.status(404).json({ success: false, message: "Subservice not found" });
    }

    /* Ensure the provided image matches stored image */

    if (subService.image !== image) {
      return res.status(400).json({ success: false, message: "Image does not match service image" });
    }

    /* Remove image from Cloudinary */

    await removeImageFromCloudinary(subService.image);

    /* Remove from DB */

    subService.image = "";
    await subService.save();

    return res.status(200).json({ success: true, message: "Subservice image removed successfully", image: subService.image })

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to remove subservice image" });
  }
};
