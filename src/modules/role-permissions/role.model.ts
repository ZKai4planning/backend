import mongoose, { Schema, Document } from "mongoose";

export interface IRole extends Document {
  roleId: string;
  roleName: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema<IRole>(
  {
    roleId: {
      type: String,
      required: true,
      unique: true,
    },
    roleName: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: Number,
      default: 0, 
      enum: [0, 1],
    },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

export const Role = mongoose.model<IRole>("Role", RoleSchema);
