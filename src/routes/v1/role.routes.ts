import { Router } from "express";
import { createRole, getAllRoles, updateRole } from "../../modules/role-permissions/role.controller";


const router = Router();

// Create role
router.post("/", createRole);

// Get all roles
router.get("/", getAllRoles);

// Update role by roleId
router.put("/:roleId", updateRole);

export default router;
