import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubService extends Document {
  service: Types.ObjectId;
  subServiceId: string;
  title: string;
  subtitle: string;
  description: string;
  images: string[];
  status: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
}

/* ---------- Regex Helpers ---------- */

const TITLE_REGEX = /^[A-Za-z0-9 &_,()\-:.']+$/;
const NO_HTML_REGEX = /<[^>]*>/;
const REPEATED_CHAR_REGEX = /(.)\1{2,}/;

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const subServiceSchema = new Schema<ISubService>(
  {
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service reference is required"],
      description: "Reference to the parent Service document"
    },

    subServiceId: {
      type: String,
      required: [true, "SubService ID is required"],
      unique: true,
      description: "Unique identifier for the sub service"
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
      description: "Main sub service title displayed in listings"
    },

    subtitle: {
      type: String,
      required: [true, "Subtitle is required"],
      trim: true,
      set: normalizeWhitespace,
      minlength: [5, "Subtitle must be at least 5 characters"],
      maxlength: [150, "Subtitle cannot exceed 150 characters"],
      match: [
        TITLE_REGEX,
        "Subtitle can only contain letters, numbers, spaces, &, -, _, :, () and commas"
      ],
      validate: [
        {
          validator: (value: string) => !REPEATED_CHAR_REGEX.test(value),
          message:
            "Subtitle cannot contain more than 2 consecutive identical characters"
        },
        {
          validator: (value: string) => !NO_HTML_REGEX.test(value),
          message: "Subtitle cannot contain HTML or script tags"
        }
      ],
      description: "Short description displayed above the title in listings"
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      description:
        "Detailed description of the sub service displayed on the sub service detail page"
    },

    images: {
      type: [String],
      default: [],
      description: "Array of image URLs representing the sub service"
    },

    status: {
      type: Boolean,
      default: true,
      description: "Indicates whether the sub service is active or inactive"
    },

    isDeleted: {
      type: Boolean,
      default: false,
      description: "Soft delete flag. True means the record is logically deleted"
    },

    deletedAt: {
      type: Date,
      default: null,
      description: "Timestamp when the sub service was soft deleted"
    }
  },
  { timestamps: true }
);

export const SubService = mongoose.model<ISubService>(
  "SubService",
  subServiceSchema
);