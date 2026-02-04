import mongoose from "mongoose";

export interface IAddressLookup {
  UPRN: number;
  PARENT_UPRN?: number;
  UDPRN: number;
  USRN?: number;
  TOID?: string;
  CLASSIFICATION_CODE?: string;

  EASTING?: number;
  NORTHING?: number;
  LATITUDE?: number;
  LONGITUDE?: number;

  RPC?: number;
  LAST_UPDATE_DATE?: Date;

  SINGLE_LINE_ADDRESS?: string;
  PO_BOX?: string;
  ORGANISATION?: string;
  DEPARTMENT_NAME?: string;
  SUB_BUILDING?: string;
  BUILDING_NAME?: string;
  BUILDING_NUMBER?: number;
  STREET_NAME?: string;
  LOCALITY?: string;
  TOWN_NAME?: string;
  POST_TOWN?: string;
  ISLAND?: string;
  POSTCODE?: string;
  DELIVERY_POINT_SUFFIX?: string;
  GSS_CODE?: string;
  CHANGE_CODE?: string;
}

const addressLookupSchema = new mongoose.Schema<IAddressLookup>(
  {
    UPRN: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    PARENT_UPRN: { type: Number },
    UDPRN: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    USRN: { type: Number },
    TOID: { type: String },
    CLASSIFICATION_CODE: { type: String },

    EASTING: { type: Number },
    NORTHING: { type: Number },
    LATITUDE: { type: Number },
    LONGITUDE: { type: Number },

    RPC: { type: Number },
    LAST_UPDATE_DATE: { type: Date },

    SINGLE_LINE_ADDRESS: { type: String },
    PO_BOX: { type: String },
    ORGANISATION: { type: String },
    DEPARTMENT_NAME: { type: String },
    SUB_BUILDING: { type: String },
    BUILDING_NAME: { type: String },
    BUILDING_NUMBER: { type: Number },
    STREET_NAME: { type: String },
    LOCALITY: { type: String },
    TOWN_NAME: { type: String },
    POST_TOWN: { type: String },
    ISLAND: { type: String },
    POSTCODE: { type: String },
    DELIVERY_POINT_SUFFIX: { type: String },
    GSS_CODE: { type: String },
    CHANGE_CODE: { type: String },
  },
  {
    timestamps: true,
    strict: true,
  },
);

export const AddressLookup = mongoose.model<IAddressLookup>(
  "AddressLookup",
  addressLookupSchema,
);
