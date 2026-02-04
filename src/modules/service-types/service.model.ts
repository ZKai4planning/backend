import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  serviceId: string;
  name: string;
  description?: string;
  images: string[]; // array of image URLs (or objects)
}

const serviceSchema = new Schema<IService>(
  {
    serviceId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    images: {
      type: [String], // behaves like jsonb array
      default: []
    }
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>("Service", serviceSchema);
