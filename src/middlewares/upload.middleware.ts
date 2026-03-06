import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadTypes } from "../config/upload.config";

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    const folder = (req as any).uploadFolder || "uploads";

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },

  filename: (req, file, cb) => {

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);

    cb(null, uniqueName + ext);
  }
});


export const createUploader = (type: keyof typeof uploadTypes) => {

  const config = uploadTypes[type];

  const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {

    if (!config.mimeTypes.includes(file.mimetype)) {

      return cb(
        new Error(`Invalid file type. Allowed: ${config.mimeTypes.join(", ")}`)
      );
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: config.maxSize
    }
  });
};