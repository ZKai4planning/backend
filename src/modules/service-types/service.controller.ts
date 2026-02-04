import { Request, Response } from "express";
import { Service } from "./service.model";
import { generateId } from "../../utils/generators";
import cloudinary from "../../config/cloudinary";
import upload from "../../middlewares/multer";
import fs from "fs";

// CREATE SERVICE



export const createService = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    let imageUrls: string[] = [];

    // Upload images to Cloudinary
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = req.files.map((file: Express.Multer.File) =>
        cloudinary.uploader.upload(file.path, {
          folder: "service_types",
        })
      );

      const results = await Promise.all(uploadPromises);
      imageUrls = results.map((result) => result.secure_url);
    }

    const service = await Service.create({
      serviceId: generateId(),
      name,
      description,
      images: imageUrls,
    });

    res.status(201).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create service" });
  }
};



// UPDATE SERVICE
export const updateService = [
  upload.array("images"),
  async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const { name, description } = req.body;

      const service = await Service.findOne({ serviceId });
      if (!service) return res.status(404).json({ message: "Service not found" });

      let imageUrls = service.images || [];

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const results = await Promise.all(
          req.files.map(file => cloudinary.uploader.upload(file.path, { folder: "service_types" }))
        );
        const newImageUrls = results.map(r => r.secure_url);
        imageUrls = [...imageUrls, ...newImageUrls];

        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }

      const updated = await Service.findOneAndUpdate(
        { serviceId },  // query by custom field
        { name, description, images: imageUrls },
        { new: true, runValidators: true }
      );

      res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update service" });
    }
  }
];


// GET ALL SERVICES (only id + name)
export const getServiceList = async (_req: Request, res: Response) => {
  try {
    const services = await Service.find(
      {},
      { serviceId: 1, name: 1, _id: 0 }
    );

    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
};


// GET ALL SERVICES (all details)
export const getAllServiceList = async (_req: Request, res: Response) => {
  try {
    const services = await Service.find(
      {},
      {
        serviceId: 1,
        name: 1,
        description: 1,
        images: 1,
        _id: 0
      }
    );

    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
};


// GET SERVICE DETAILS
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



export const removeServiceImages = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { images } = req.body; // array of image URLs

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "Images array is required" });
    }

    const service = await Service.findOne({ serviceId });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // 🔹 Extract Cloudinary public_id from URL
    const publicIds = images.map((url: string) => {
      const parts = url.split("/");
      const fileName = parts.pop()?.split(".")[0];
      const folder = parts.slice(parts.indexOf("service_types")).join("/");
      return `${folder}/${fileName}`;
    });

    // 🔹 Delete from Cloudinary
    await Promise.all(
      publicIds.map(publicId =>
        cloudinary.uploader.destroy(publicId)
      )
    );

    // 🔹 Remove from DB
    service.images = service.images.filter(
      (img: string) => !images.includes(img)
    );

    await service.save();

    res.status(200).json({
      message: "Images removed successfully",
      images: service.images
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove images" });
  }
};