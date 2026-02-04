import { Request, Response } from "express";
import { AddressLookup } from "./address-lookup.model";


export const createAddressLookup = async (
  req: Request,
  res: Response,
) => {
  try {
    const payload = {
      ...req.body,

 
      UPRN: Number(req.body.UPRN),
      PARENT_UPRN: req.body.PARENT_UPRN
        ? Number(req.body.PARENT_UPRN)
        : undefined,
      UDPRN: Number(req.body.UDPRN),
      USRN: req.body.USRN ? Number(req.body.USRN) : undefined,
      RPC: req.body.RPC ? Number(req.body.RPC) : undefined,

      EASTING: req.body.EASTING ? Number(req.body.EASTING) : undefined,
      NORTHING: req.body.NORTHING ? Number(req.body.NORTHING) : undefined,
      LATITUDE: req.body.LATITUDE ? Number(req.body.LATITUDE) : undefined,
      LONGITUDE: req.body.LONGITUDE ? Number(req.body.LONGITUDE) : undefined,

      BUILDING_NUMBER: req.body.BUILDING_NUMBER
        ? Number(req.body.BUILDING_NUMBER)
        : undefined,
    };

    const address = new AddressLookup(payload);
    const savedAddress = await address.save();

    return res.status(201).json({
      success: true,
      data: savedAddress,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Address with this UPRN or UPRN already exists",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create address",
    });
  }
};


export const getAddressesByPostcode = async (
  req: Request,
  res: Response,
) => {
  try {
    const rawPostcode = req.params.postcode;

    if (!rawPostcode || Array.isArray(rawPostcode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid postcode",
      });
    }

    const normalizedPostcode = rawPostcode
      .replace(/\s+/g, "")
      .toUpperCase();

    const addresses = await AddressLookup.find(
      {
        POSTCODE: {
          $regex: `^${normalizedPostcode.slice(
            0,
            -3,
          )}\\s*${normalizedPostcode.slice(-3)}$`,
          $options: "i",
        },
      },
      {
        _id: 0,
        SINGLE_LINE_ADDRESS: 1,
        UPRN: 1,
      },
    ).sort({
      BUILDING_NUMBER: 1,
    });

    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch addresses",
    });
  }
};





interface UprnParams {
  uprn: string;
}


export const getAddressDetailsByUprn = async (
  req: Request<UprnParams>,
  res: Response,
) => {
  try {
    const rawUprn = req.params.uprn;

    if (!rawUprn) {
      return res.status(400).json({
        success: false,
        message: "UPRN is required",
      });
    }

    const uprn = Number(rawUprn);

    if (!Number.isInteger(uprn) || uprn <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid UPRN is required",
      });
    }

    const address = await AddressLookup.findOne({ UPRN: uprn }).select({
      UPRN: 1,
      UDPRN: 1,
      SINGLE_LINE_ADDRESS: 1,
      LATITUDE: 1,
      LONGITUDE: 1,
      EASTING: 1,
      NORTHING: 1,
      BUILDING_NAME: 1,
      BUILDING_NUMBER: 1,
      STREET_NAME: 1,
      LOCALITY: 1,
      POST_TOWN: 1,
      TOWN_NAME: 1,
      _id: 0,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found for this UPRN",
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch address details",
    });
  }
};
