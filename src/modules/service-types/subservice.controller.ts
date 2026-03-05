import { Request, Response } from "express";
import { SubService } from "./subservice.model";
import { Service } from "./service.model";
import { generateId } from "../../utils/generators";



/**
 * CREATE SUBSERVICE
 */
export const createSubService = async (req: Request, res: Response) => {
  try {

    const { serviceId, name, description, status } = req.body;

    if (!serviceId || !name) {
      return res.status(400).json({
        message: "serviceId and name are required"
      });
    }

    const service = await Service.findOne({ serviceId });

    if (!service) {
      return res.status(404).json({
        message: "Parent service not found"
      });
    }

    const subService = await SubService.create({
      subServiceId: generateId(),
      service: service._id,
      name,
      description,
      status: status ?? true
    });

    res.status(201).json(subService);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create subservice"
    });
  }
};



/**
 * GET SUBSERVICES BY SERVICE
 */
export const getSubServicesByService = async (
  req: Request,
  res: Response
) => {

  try {

    const { serviceId } = req.params;

    const service = await Service.findOne({ serviceId });

    if (!service) {
      return res.status(404).json({
        message: "Service not found"
      });
    }

    const subservices = await SubService.find({
      service: service._id
    });

    res.json(subservices);

  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch subservices"
    });
  }
};



/**
 * UPDATE SUBSERVICE
 */
export const updateSubService = async (
  req: Request,
  res: Response
) => {

  try {

    const { subServiceId } = req.params;
    const { name, description, status } = req.body;

    const updated = await SubService.findOneAndUpdate(
      { subServiceId },
      {
        name,
        description,
        status
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Subservice not found"
      });
    }

    res.json(updated);

  } catch (err) {
    res.status(500).json({
      message: "Failed to update subservice"
    });
  }
};



/**
 * DELETE SUBSERVICE
 */
export const deleteSubService = async (
  req: Request,
  res: Response
) => {

  try {

    const { subServiceId } = req.params;

    const deleted = await SubService.findOneAndDelete({
      subServiceId
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Subservice not found"
      });
    }

    res.json({
      message: "Subservice deleted successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to delete subservice"
    });
  }
};