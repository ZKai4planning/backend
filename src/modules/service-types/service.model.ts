import mongoose, { Schema, Document, Types } from "mongoose";
import { TITLE_REGEX, REPEATED_CHAR_REGEX, NO_HTML_REGEX, normalizeWhitespace } from "../../utils/regex.utils";

export interface IService extends Document {
  serviceId: string;
  title: string;
  serviceName: string;
  description: string;
  image: string;
  status: boolean;
  subServices: Types.ObjectId[];
}

const serviceSchema = new Schema<IService>(
  {
    serviceId: {
      type: String,
      required: true,
      unique: true
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      unique: true,
      trim: true,
      set: normalizeWhitespace,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
      match: [
        TITLE_REGEX,
        "Title can only contain letters, numbers, spaces, &, -, _, :, () and commas"
      ],
      validate: [
        {
          validator: (value: string) => !REPEATED_CHAR_REGEX.test(value),
          message:
            "Title cannot contain more than 2 consecutive identical characters"
        },
        {
          validator: (value: string) => !NO_HTML_REGEX.test(value),
          message: "Title cannot contain HTML or script tags"
        }
      ],
      description: "Main service title displayed in listings"
    },

    serviceName: {
      type: String,
      required: [true, "Service Name is required"],
      trim: true,
      set: normalizeWhitespace,
      minlength: [5, "Service Name must be at least 5 characters"],
      maxlength: [150, "Service Name cannot exceed 150 characters"],
      match: [
        TITLE_REGEX,
        "Service Name can only contain letters, numbers, spaces, &, -, _, :, () and commas"
      ],
      validate: [
        {
          validator: (value: string) => !REPEATED_CHAR_REGEX.test(value),
          message:
            "Service Name cannot contain more than 2 consecutive identical characters"
        },
        {
          validator: (value: string) => !NO_HTML_REGEX.test(value),
          message: "Service Name cannot contain HTML or script tags"
        }
      ],
      description: "Service name displayed in listings"
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      description: "Detailed description of the service displayed on the service detail page"
    },

    image: {
      type: String,
      trim: true,
      default: "",
      description: "URL of the main image representing the service"
    },

    status: {
      type: Boolean,
      default: true,
      description: "Indicates whether the service is active or inactive"
    },

    subServices: {
      type: [Schema.Types.ObjectId],
      ref: "SubService",
      default: [],
      description: "References to related SubService documents"
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const Service = mongoose.model<IService>("Service", serviceSchema);
