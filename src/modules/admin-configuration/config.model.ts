import mongoose, { Document, Model } from "mongoose";

export interface IConfiguration extends Document {
  defaultPassword: string;
  plainDefaultPassword: string;
  logoUrl: string;
}

interface ConfigurationModel extends Model<IConfiguration> {
  getConfig(): Promise<IConfiguration>;
}

const configurationSchema = new mongoose.Schema<IConfiguration>(
  {
    defaultPassword: {
      type: String,
      required: true,
      trim: true,
      description: "Hashed default password for new users",
    },
    plainDefaultPassword: {
      type: String,
      required: true,
      trim: true,
      minlength: [8, "Default password must be at least 8 characters"],
      maxlength: [100, "Default password cannot exceed 100 characters"],
      description: "Plain text default password for new users",
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true,
      description: "URL of the uploaded logo image",
    },
  },
  { timestamps: true }
);

/* Singleton configuration */

configurationSchema.statics.getConfig = async function () {
  let config = await this.findOne();

  if (!config) {
    config = await this.create({
      defaultPassword: "",
      plainDefaultPassword: "Secure@2026",
      logoUrl: "",
    });
  }

  return config;
};

export const Configuration = mongoose.model<
  IConfiguration,
  ConfigurationModel
>("Configuration", configurationSchema);