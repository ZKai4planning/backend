import { Request, Response } from "express";
import { Service } from "./service.model";
import { generateId } from "../../utils/generators";
import cloudinary from "../../config/cloudinary";
import upload from "../../middlewares/multer";
import fs from "fs";

/**
 * CREATE SERVICE
 */
export const createService = [
  upload.array("images"),
  async (req: Request, res: Response) => {
    try {
      const { name, description, status } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      let imageUrls: string[] = [];

      if (req.files && Array.isArray(req.files)) {
        const uploadPromises = req.files.map((file: Express.Multer.File) =>
          cloudinary.uploader.upload(file.path, {
            folder: "services",
          })
        );

        const results = await Promise.all(uploadPromises);

        imageUrls = results.map((result) => result.secure_url);

        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }

      const service = await Service.create({
        serviceId: generateId(),
        name,
        description,
        images: imageUrls,
        status: status ?? true
      });

      res.status(201).json(service);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create service" });
    }
  }
];


/**
 * UPDATE SERVICE
 */
export const updateService = [
  upload.array("images"),
  async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const { name, description, status } = req.body;

      const service = await Service.findOne({ serviceId });

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      let imageUrls = service.images || [];

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const uploads = await Promise.all(
          req.files.map(file =>
            cloudinary.uploader.upload(file.path, {
              folder: "services"
            })
          )
        );

        const newUrls = uploads.map(r => r.secure_url);
        imageUrls = [...imageUrls, ...newUrls];

        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }

      const updated = await Service.findOneAndUpdate(
        { serviceId },
        {
          name,
          description,
          status,
          images: imageUrls
        },
        { new: true }
      );

      res.json(updated);

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update service" });
    }
  }
];


/**
 * GET SERVICE LIST (dropdown)
 */
export const getServiceList = async (_req: Request, res: Response) => {
  try {

    const services = await Service.find(
      { status: true },
      { serviceId: 1, name: 1, _id: 0 }
    );

    res.json(services);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
};


/**
 * GET ALL SERVICES
 */
export const getAllServiceList = async (_req: Request, res: Response) => {
  try {

    const services = await Service.find(
      {},
      {
        serviceId: 1,
        name: 1,
        description: 1,
        images: 1,
        status: 1,
        _id: 0
      }
    );

    res.json(services);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
};


/**
 * GET SERVICE DETAILS
 */
export const getServiceDetails = async (req: Request, res: Response) => {
  try {

    const { serviceId } = req.params;

    const service = await Service.findOne({ serviceId });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch service" });
  }
};


/**
 * DELETE SERVICE IMAGES
 */
export const removeServiceImages = async (req: Request, res: Response) => {
  try {

    const { serviceId } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images)) {
      return res.status(400).json({ message: "Images array required" });
    }

    const service = await Service.findOne({ serviceId });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    for (const url of images) {

      const publicId = url
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];

      await cloudinary.uploader.destroy(publicId);
    }

    service.images = service.images.filter(
      img => !images.includes(img)
    );

    await service.save();

    res.json({
      message: "Images removed successfully",
      images: service.images
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove images" });
  }
};
