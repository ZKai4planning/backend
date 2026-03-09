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

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const formatMongooseValidationErrors = (error: any) => {
  const errors: Record<string, string> = {};
  if (!error?.errors || typeof error.errors !== "object") return errors;
  Object.keys(error.errors).forEach((key) => {
    const message = error.errors[key]?.message;
    if (typeof message === "string") errors[key] = message;
  });
  return errors;
};

const cleanupTempFiles = async (files: Express.Multer.File[] = []) => {
  await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => { })));
};

/* -------------------------------- */
/* Cloudinary Helpers */
/* -------------------------------- */

const uploadImage = async (
  files: Express.Multer.File[],
  folder: "services" | "subservices"
) => {
  if (!files?.length) return "";

  const upload = await cloudinary.uploader.upload(files[0].path, { folder });

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

const removeCloudinaryImage = async (image: string) => {
  if (!image) return;

  const publicId = extractPublicId(image);
  if (publicId) await cloudinary.uploader.destroy(publicId);
};

/* -------------------------------- */
/* CREATE SERVICE OR SUB SERVICE*/
/* -------------------------------- */

export const createServiceOrSubService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ||
    (req.file ? [req.file] : []);

  try {
    const { serviceId, status } = req.body;
    const title = normalizeText(req.body.title);
    const serviceName = normalizeText(req.body.serviceName);
    const description = normalizeText(req.body.description);

    if (!title || !serviceName || !description) {
      return res.status(400).json({ success: false, message: "Title, serviceName and description are required" });
    }
    if (title.length < 3) return res.status(400).json({ success: false, message: "Title must be at least 3 characters" });
    if (serviceName.length < 5)
      return res.status(400).json({ success: false, message: "serviceName must be at least 5 characters" });
    if (description.length < 10)
      return res.status(400).json({ success: false, message: "Description must be at least 10 characters" });

    /* -----------------------------
       CREATE SUBSERVICE
    ----------------------------- */

    if (serviceId) {
      const parentService = await Service.findOne({ serviceId });

      if (!parentService) {
        return res.status(404).json({ success: false, message: "Parent service not found" });
      }

      /* Prevent duplicate subservice title under same service */

      const existingSubService = await SubService.findOne({
        service: parentService._id,
        title
      });

      if (existingSubService) {
        return res.status(409).json({ success: false, message: "SubService with this title already exists for this service" });
      }

      const imageUrl = await uploadImage(files, "subservices");

      const subService = await SubService.create({
        subServiceId: generateId(),
        service: parentService._id,
        title,
        subServiceName: serviceName,
        description,
        image: imageUrl,
        status: toBool(status, true)
      });

      /* link to parent */

      parentService.subServices.push(subService._id);
      await parentService.save();

      return res.status(201).json({ success: true, message: "SubService created successfully" });
    }

    /* -----------------------------
       CREATE SERVICE
    ----------------------------- */

    /* Check duplicate service title */

    const existingService = await Service.findOne({ title });

    if (existingService) {
      return res.status(409).json({ success: false, message: "Service with this title already exists" });
    }

    const imageUrl = await uploadImage(files, "services");

    const service = await Service.create({
      serviceId: generateId(),
      title,
      serviceName: serviceName,
      description,
      image: imageUrl,
      status: toBool(status, true),
      subServices: []
    });

    return res.status(201).json({ success: true, message: "Service created successfully" });

  } catch (error: any) {

    /* Handle Mongo duplicate error fallback */

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate title already exists" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatMongooseValidationErrors(error),
      });
    }

    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to create resource" });
  } finally {
    await cleanupTempFiles(files);
  }
};

/* -------------------------------- */
/* CREATE SERVICE */
/* -------------------------------- */

export const createService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ||
    (req.file ? [req.file] : []);

  try {
    const { status } = req.body;
    const title = normalizeText(req.body.title);
    const serviceName = normalizeText(req.body.serviceName);
    const description = normalizeText(req.body.description);

    if (!title || !serviceName || !description) {
      return res.status(400).json({ success: false, message: "Title, serviceName and description are required" });
    }
    if (title.length < 3) return res.status(400).json({ success: false, message: "Title must be at least 3 characters" });
    if (serviceName.length < 5)
      return res.status(400).json({ success: false, message: "serviceName must be at least 5 characters" });
    if (description.length < 10)
      return res.status(400).json({ success: false, message: "Description must be at least 10 characters" });

    /* Check duplicate service title */

    const existingService = await Service.findOne({ title });

    if (existingService) {
      return res.status(409).json({ success: false, message: "Service with this title already exists" });
    }

    const imageUrl = await uploadImage(files, "services");

    const service = await Service.create({
      serviceId: generateId(),
      title,
      serviceName: serviceName,
      description,
      image: imageUrl,
      status: toBool(status, true)
    });

    return res.status(201).json({ success: true, message: "Service created successfully" });

  } catch (error: any) {
    /* Handle Mongo duplicate error fallback */
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate title already exists" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatMongooseValidationErrors(error),
      });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to create service" });
  } finally {
    await cleanupTempFiles(files);
  }
};

/* -------------------------------- */
/* UPDATE SERVICE */
/* -------------------------------- */

export const updateService = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ||
    (req.file ? [req.file] : []);

  try {
    const { serviceId } = req.params;
    const { status } = req.body;
    const title =
      req.body.title !== undefined ? normalizeText(req.body.title) : undefined;
    const serviceName =
      req.body.serviceName !== undefined
        ? normalizeText(req.body.serviceName)
        : undefined;
    const description =
      req.body.description !== undefined
        ? normalizeText(req.body.description)
        : undefined;

    const service = await Service.findOne({ serviceId });
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    const newImage = await uploadImage(files, "services");

    const updatePayload: any = {
      image: newImage || service.image
    };

    if (title !== undefined) {
      if (!title || title.length < 3) {
        return res.status(400).json({ success: false, message: "Title must be at least 3 characters" });
      }
      updatePayload.title = title;
    }
    if (serviceName !== undefined) {
      if (!serviceName || serviceName.length < 5) {
        return res.status(400).json({ success: false, message: "serviceName must be at least 5 characters" });
      }
      updatePayload.serviceName = serviceName;
    }
    if (description !== undefined) {
      if (!description || description.length < 10) {
        return res.status(400).json({ success: false, message: "Description must be at least 10 characters" });
      }
      updatePayload.description = description;
    }
    if (status !== undefined)
      updatePayload.status = toBool(status, service.status);

    const updatedService = await Service.findOneAndUpdate(
      { serviceId },
      updatePayload,
      { new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, message: "Service updated successfully" });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatMongooseValidationErrors(error),
      });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to update service" });
  } finally {
    await cleanupTempFiles(files);
  }
};

/* -------------------------------- */
/* GET ACTIVE SERVICES */
/* -------------------------------- */

export const getServiceList = async (req: Request, res: Response) => {
  try {
    const includeDeleted = req.query.includeDeleted === "true";
    const services = await Service.find(
      includeDeleted ? {} : { status: true },
      {
        serviceId: 1,
        title: 1,
        serviceName: 1,
        description: 1,
        image: 1,
        status: 1,
        subServices: 1,
        _id: 0
      }
    )
      .populate({
        path: "subServices",
        match: { status: true },
        select: "subServiceId title subServiceName description image status -_id"
      })
      .lean();

    const formattedServices = services.map((service: any) => ({
      serviceId: service.serviceId,
      title: service.title,
      serviceName: service.serviceName,
      description: service.description,
      image: service.image,
      status: service.status,
      subServices: service.subServices.map((sub: any) => ({
        serviceId: service.serviceId, // attach parent serviceId
        subServiceId: sub.subServiceId,
        title: sub.title,
        subServiceName: sub.subServiceName,
        description: sub.description,
        image: sub.image,
        status: sub.status
      }))
    }));

    return res.status(200).json({ success: true, message: "Services fetched successfully", data: formattedServices });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
};

/* -------------------------------- */
/* GET ALL SERVICES */
/* -------------------------------- */

export const getAllServiceList = async (req: Request, res: Response) => {
  try {
    const includeDeleted = req.query.includeDeleted === "true";

    const services = await Service.find(includeDeleted ? {} : { status: true }).select(
      "serviceId title serviceName description image status"
    ).lean();

    const formattedServices = services.map((service: any) => ({
      serviceId: service.serviceId,
      title: service.title,
      serviceName: service.serviceName,
      description: service.description,
      image: service.image,
      status: service.status
    }));

    return res.status(200).json({ success: true, message: "Services fetched successfully", data: formattedServices });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
};

/* -------------------------------- */
/* SERVICE DETAILS */
/* -------------------------------- */

export const getServiceDetails = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const includeDeleted = req.query.includeDeleted === "true";
    const service = await Service.findOne({
      serviceId,
      ...(includeDeleted ? {} : { status: true })
    }).populate("subServices");

    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    return res.status(200).json({ success: true, message: "Service fetched successfully", data: service });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch service" });
  }
};

/* -------------------------------- */
/* SOFT DELETE */
/* -------------------------------- */

export const softDeleteService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findOne({ serviceId });
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    service.status = false;

    await service.save();

    await SubService.updateMany(
      { service: service._id },
      { status: false }
    );

    return res.status(200).json({ success: true, message: "Service soft deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to delete service" });
  }
};

/* -------------------------------- */
/* RESTORE SERVICE */
/* -------------------------------- */

export const restoreService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findOne({ serviceId });
    if (!service) return res.status(404).json({ success: false, message: "Deleted service not found" });

    service.status = true;

    await service.save();

    await SubService.updateMany(
      { service: service._id },
      { status: true }
    );

    return res.status(200).json({ success: true, message: "Service restored successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to restore service" });
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
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    await removeCloudinaryImage(service.image);

    const subServices = await SubService.find({ service: service._id }).session(
      session
    );

    for (const sub of subServices) {
      await removeCloudinaryImage(sub.image);
    }

    await SubService.deleteMany({ service: service._id }).session(session);
    await Service.deleteOne({ _id: service._id }).session(session);

    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Service permanently deleted" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to permanently delete service" });
  } finally {
    session.endSession();
  }
};

/* -------------------------------- */
/* REMOVE SERVICE IMAGE */
/* -------------------------------- */

export const removeServiceImage = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const service = await Service.findOne({ serviceId });

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    /* Ensure the provided image matches stored image */

    if (service.image !== image) {
      return res.status(400).json({ success: false, message: "Image does not match service image" });
    }

    /* Remove image from Cloudinary */

    await removeCloudinaryImage(service.image);

    /* Remove from DB */

    service.image = "";
    await service.save();

    return res.status(200).json({ success: true, message: "Image removed successfully", data: { image: image } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to remove image" });
  }
};
