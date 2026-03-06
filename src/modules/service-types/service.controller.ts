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

const uploadImages = async (
  files: Express.Multer.File[],
  folder: "services" | "subservices"
) => {
  if (!files?.length) return [];

  const uploads = await Promise.all(
    files.map((file) =>
      cloudinary.uploader.upload(file.path, { folder })
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

const removeCloudinaryImages = async (images: string[]) => {
  if (!images?.length) return;

  await Promise.all(
    images.map(async (url) => {
      const publicId = extractPublicId(url);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    })
  );
};

/* -------------------------------- */
/* CREATE SERVICE OR SUB SERVICE*/
/* -------------------------------- */

export const createServiceOrSubService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  try {
    const { serviceId, title, subtitle, description, status } = req.body;

    if (!title || !subtitle || !description) {
      return sendError(res, 400, "Title, subtitle and description are required");
    }

    /* -----------------------------
       CREATE SUBSERVICE
    ----------------------------- */

    if (serviceId) {
      const parentService = await Service.findOne({
        serviceId,
        isDeleted: false
      });

      if (!parentService) {
        return sendError(res, 404, "Parent service not found");
      }

      /* Prevent duplicate subservice title under same service */

      const existingSubService = await SubService.findOne({
        service: parentService._id,
        title,
        isDeleted: false
      });

      if (existingSubService) {
        return sendError(res, 409, "SubService with this title already exists for this service");
      }

      const imageUrls = await uploadImages(files, "subservices");

      const subService = await SubService.create({
        subServiceId: generateId(),
        service: parentService._id,
        title,
        subtitle,
        description,
        images: imageUrls,
        status: toBool(status, true),
        isDeleted: false,
        deletedAt: null
      });

      /* link to parent */

      parentService.subServices.push(subService._id);
      await parentService.save();

      return sendSuccess(
        res,
        201,
        "SubService created successfully",
        subService
      );
    }

    /* -----------------------------
       CREATE SERVICE
    ----------------------------- */

    /* Check duplicate service title */

    const existingService = await Service.findOne({
      title,
      isDeleted: false
    });

    if (existingService) {
      return sendError(res, 409, "Service with this title already exists");
    }

    const imageUrls = await uploadImages(files, "services");

    const service = await Service.create({
      serviceId: generateId(),
      title,
      subtitle,
      description,
      images: imageUrls,
      status: toBool(status, true),
      isDeleted: false,
      deletedAt: null,
      subServices: []
    });

    return sendSuccess(res, 201, "Service created successfully", service);

  } catch (error: any) {

     /* Handle Mongo duplicate error fallback */

    if (error.code === 11000) {
      return sendError(res, 409, "Duplicate title already exists");
    }

    console.error(error);
    return sendError(res, 500, "Failed to create resource");
  } finally {
    await cleanupTempFiles(files);
  }
};

/* -------------------------------- */
/* CREATE SERVICE */
/* -------------------------------- */

export const createService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  try {
    const { title, subtitle, description, status } = req.body;

    if (!title || !subtitle || !description) {
      return sendError(res, 400, "Title, subtitle and description are required");
    }

    /* Check duplicate service title */

    const existingService = await Service.findOne({
      title,
      isDeleted: false
    });

    if (existingService) {
      return sendError(res, 409, "Service with this title already exists");
    }

    const imageUrls = await uploadImages(files, "services");

    const service = await Service.create({
      serviceId: generateId(),
      title,
      subtitle,
      description,
      images: imageUrls,
      status: toBool(status, true),
      isDeleted: false,
      deletedAt: null
    });

    return sendSuccess(res, 201, "Service created successfully", service);
  } catch (error: any) {
      /* Handle Mongo duplicate error fallback */
    if (error.code === 11000) {
      return sendError(res, 409, "Duplicate title already exists");
    }
    console.error(error);
    return sendError(res, 500, "Failed to create service");
  } finally {
    await cleanupTempFiles(files);
  }
};

/* -------------------------------- */
/* UPDATE SERVICE */
/* -------------------------------- */

export const updateService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  try {
    const { serviceId } = req.params;
    const { title, subtitle, description, status } = req.body;

    const service = await Service.findOne({ serviceId, isDeleted: false });
    if (!service) return sendError(res, 404, "Service not found");

    const newImages = await uploadImages(files, "services");

    const updatePayload: Partial<typeof service> = {
      images: [...service.images, ...newImages]
    };

    if (title) updatePayload.title = title;
    if (subtitle) updatePayload.subtitle = subtitle;
    if (description) updatePayload.description = description;
    if (status !== undefined)
      updatePayload.status = toBool(status, service.status);

    const updatedService = await Service.findOneAndUpdate(
      { serviceId },
      updatePayload,
      { new: true }
    );

    return sendSuccess(res, 200, "Service updated successfully", updatedService);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to update service");
  } finally {
    await cleanupTempFiles(files);
  }
};

/* -------------------------------- */
/* GET ACTIVE SERVICES */
/* -------------------------------- */

export const getServiceList = async (_req: Request, res: Response) => {
  try {
    const services = await Service.find(
      { status: true, isDeleted: false },
      { serviceId: 1, title: 1, status: 1, _id: 0 }
    );

    return sendSuccess(res, 200, "Services fetched successfully", services);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to fetch services");
  }
};

/* -------------------------------- */
/* GET ALL SERVICES */
/* -------------------------------- */

export const getAllServiceList = async (req: Request, res: Response) => {
  try {
    const includeDeleted = req.query.includeDeleted === "true";

    const filter = includeDeleted ? {} : { isDeleted: false };

    const services = await Service.find(filter).select(
      "serviceId title subtitle description images status isDeleted deletedAt"
    ).lean();

    return sendSuccess(res, 200, "Services fetched successfully", services);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to fetch services");
  }
};

/* -------------------------------- */
/* SERVICE DETAILS */
/* -------------------------------- */

export const getServiceDetails = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const includeDeleted = req.query.includeDeleted === "true";

    const service = await Service.findOne(
      includeDeleted ? { serviceId } : { serviceId, isDeleted: false }
    ).populate("subServices");

    if (!service) return sendError(res, 404, "Service not found");

    return sendSuccess(res, 200, "Service fetched successfully", service);
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to fetch service");
  }
};

/* -------------------------------- */
/* SOFT DELETE */
/* -------------------------------- */

export const softDeleteService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findOne({ serviceId, isDeleted: false });
    if (!service) return sendError(res, 404, "Service not found");

    service.isDeleted = true;
    service.deletedAt = new Date();
    service.status = false;

    await service.save();

    await SubService.updateMany(
      { service: service._id },
      { isDeleted: true, deletedAt: new Date(), status: false }
    );

    return sendSuccess(res, 200, "Service soft deleted successfully");
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to delete service");
  }
};

/* -------------------------------- */
/* RESTORE SERVICE */
/* -------------------------------- */

export const restoreService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findOne({ serviceId, isDeleted: true });
    if (!service) return sendError(res, 404, "Deleted service not found");

    service.isDeleted = false;
    service.deletedAt = null;
    service.status = true;

    await service.save();

    await SubService.updateMany(
      { service: service._id },
      { isDeleted: false, deletedAt: null, status: true }
    );

    return sendSuccess(res, 200, "Service restored successfully");
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to restore service");
  }
};

/* -------------------------------- */
/* PERMANENT DELETE */
/* -------------------------------- */

export const permanentlyDeleteService = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { serviceId } = req.params;

    session.startTransaction();

    const service = await Service.findOne({ serviceId }).session(session);
    if (!service) return sendError(res, 404, "Service not found");

    await removeCloudinaryImages(service.images);

    const subServices = await SubService.find({ service: service._id }).session(
      session
    );

    for (const sub of subServices) {
      await removeCloudinaryImages(sub.images);
    }

    await SubService.deleteMany({ service: service._id }).session(session);
    await Service.deleteOne({ _id: service._id }).session(session);

    await session.commitTransaction();

    return sendSuccess(res, 200, "Service permanently deleted");
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return sendError(res, 500, "Failed to permanently delete service");
  } finally {
    session.endSession();
  }
};

/* -------------------------------- */
/* REMOVE SERVICE IMAGES */
/* -------------------------------- */

export const removeServiceImages = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images) || !images.length)
      return sendError(res, 400, "Images array required");

    const service = await Service.findOne({ serviceId, isDeleted: false });
    if (!service) return sendError(res, 404, "Service not found");

    await removeCloudinaryImages(images);

    service.images = service.images.filter((img) => !images.includes(img));
    await service.save();

    return sendSuccess(res, 200, "Images removed successfully", {
      images: service.images
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Failed to remove images");
  }
};