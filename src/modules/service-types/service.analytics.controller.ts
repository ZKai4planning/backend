import { Request, Response } from "express";
import { Service } from "./service.model";
import { SubService } from "./subservice.model";

export const serviceAnalytics = async (_req: Request, res: Response) => {
  try {

    const totalServices = await Service.countDocuments();

    const activeServices = await Service.countDocuments({ status: true });

    const inactiveServices = await Service.countDocuments({ status: false });

    const totalSubServices = await SubService.countDocuments();

    const avgSubServices = totalServices
      ? totalSubServices / totalServices
      : 0;

    res.json({
      totalServices,
      activeServices,
      inactiveServices,
      totalSubServices,
      avgSubServicesPerService: avgSubServices
    });

  } catch (err) {

    res.status(500).json({
      message: "Failed to fetch analytics"
    });

  }
};

export const serviceBreakdown = async (_req: Request, res: Response) => {

  try {

    const data = await Service.aggregate([
      {
        $lookup: {
          from: "subservices",
          localField: "_id",
          foreignField: "service",
          as: "subservices"
        }
      },
      {
        $project: {
          serviceId: 1,
          name: 1,
          subServiceCount: { $size: "$subservices" }
        }
      }
    ]);

    res.json(data);

  } catch (err) {

    res.status(500).json({
      message: "Failed to fetch breakdown"
    });

  }
};

export const topServices = async (_req: Request, res: Response) => {

  try {

    const data = await Service.aggregate([
      {
        $lookup: {
          from: "subservices",
          localField: "_id",
          foreignField: "service",
          as: "subservices"
        }
      },
      {
        $project: {
          serviceId: 1,
          name: 1,
          subServiceCount: { $size: "$subservices" }
        }
      },
      {
        $sort: { subServiceCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json(data);

  } catch (err) {

    res.status(500).json({
      message: "Failed to fetch top services"
    });

  }
};
