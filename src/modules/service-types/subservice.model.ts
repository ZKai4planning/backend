import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubService extends Document {
  service: Types.ObjectId;
  subServiceId: string;
  name: string;
  description?: string;
  images: string[];
  status: boolean;
}

const subServiceSchema = new Schema<ISubService>(
  {
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    subServiceId: {
      type: String,
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    images: {
      type: [String],
      default: [],
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const SubService = mongoose.model<ISubService>("SubService", subServiceSchema);
