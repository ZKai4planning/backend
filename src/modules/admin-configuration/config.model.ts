import mongoose from "mongoose";

export interface IConfiguration {
  defaultPassword: string; // hashed password
  plainDefaultPassword: string; // plain password for reference
  logoUrl: string;
}

const configurationSchema = new mongoose.Schema<IConfiguration>(
  {
    defaultPassword: { type: String, required: true },
    plainDefaultPassword: { type: String, required: true }, // new field
    logoUrl: { type: String, required: true },
  },
  { timestamps: true }
);

configurationSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      defaultPassword: "", // empty hashed password
      plainDefaultPassword: "123456", // default plain password
      logoUrl: "",
    });
  }
  return config;
};

export const Configuration = mongoose.model<IConfiguration>(
  "Configuration",
  configurationSchema
);

