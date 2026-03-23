// password-request.model.ts

import mongoose from "mongoose";

const passwordRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },

    userRefId: { type: String, required: true },
    email: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },

    processedBy: { type: String }, // admin userId
  },
  { timestamps: true }
);

export const PasswordRequest = mongoose.model(
  "PasswordRequest",
  passwordRequestSchema
);