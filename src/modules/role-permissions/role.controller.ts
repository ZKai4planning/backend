import { Request, Response } from "express";

import { generateId } from "../../utils/generators";
import { Role } from "./role.model";


export const createRole = async (req: Request, res: Response) => {
  try {
    const { roleName} = req.body;

    if (!roleName) {
      return res.status(400).json({ message: "roleName is required" });
    }

    const existing = await Role.findOne({ roleName });
    if (existing) {
      return res.status(400).json({ message: "Role name already exists" });
    }

    const roleId = await generateId();

    const role = await Role.create({ roleId: roleId, roleName });
    res.status(201).json({ message: "Role created successfully", role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json({ roles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { roleName, status } = req.body;

    const updateData: any = {};
    if (roleName !== undefined) updateData.roleName = roleName;
    if (status !== undefined) {
      if (![0, 1].includes(status)) {
        return res.status(400).json({ message: "Status must be 0 or 1" });
      }
      updateData.status = status;
    }

    const role = await Role.findOneAndUpdate({ roleId }, updateData, { new: true });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({ message: "Role updated successfully", role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
