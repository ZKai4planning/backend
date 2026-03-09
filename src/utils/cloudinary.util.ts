import cloudinary from "../config/cloudinary";
import fs from "fs";

/* -------------------------------- */
/* Upload Single Image */
/* -------------------------------- */

export const uploadSingleImage = async (
  file?: Express.Multer.File,
  folder: "config" | "services" | "subservices" = "config"
): Promise<string> => {
  if (!file) return "";

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
    });

    fs.unlinkSync(file.path);

    return result.secure_url;
  } catch (error) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

/* -------------------------------- */
/* Upload Multiple Images */
/* -------------------------------- */

export const uploadMultipleImages = async (
  files: Express.Multer.File[],
  folder: "config" | "services" | "subservices"
): Promise<string[]> => {
  if (!files?.length) return [];

  const uploadedImages: string[] = [];

  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
    });

    uploadedImages.push(result.secure_url);

    fs.unlinkSync(file.path);
  }

  return uploadedImages;
};

/* -------------------------------- */
/* Extract Public ID */
/* -------------------------------- */

export const extractPublicId = (url: string) => {
  try {
    const parts = url.split("/");
    const file = parts.pop();
    const folder = parts.pop();

    return `${folder}/${file?.split(".")[0]}`;
  } catch {
    return null;
  }
};

/* -------------------------------- */
/* Remove Image */
/* -------------------------------- */

export const removeCloudinaryImage = async (image: string) => {
  if (!image) return;

  const publicId = extractPublicId(image);

  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
};