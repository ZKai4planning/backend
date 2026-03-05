import mongoose, { Schema, Document, Types } from "mongoose";

export interface IService extends Document {
  serviceId: string;
  name: string;
  description?: string;
  images: string[]; // array of image URLs (or objects)
  status: boolean;
  subServices?: Types.ObjectId[]; // references to SubServices
}

const serviceSchema = new Schema<IService>(
  {
    serviceId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    images: {
      type: [String], // behaves like jsonb array
      default: []
    },
    status: {
      type: Boolean,
      default: true, // active by default
    },
    subServices: [
      {
        type: Schema.Types.ObjectId,
        ref: "SubService",
      },
    ],
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>("Service", serviceSchema);
