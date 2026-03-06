import express from "express";
import {
  createEmployeeUser,
  getEmployeeUsers,
  updateEmployeeByUserId,
  toggleEmployeeStatusByUserId,
  getEmployeeByUserId,
  getEmployeeUserAnalytics,
} from "../../modules/employee-users/employee.controller";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../../schemas/employee";
import { validate } from "../../middlewares/zod.middleware";

const router = express.Router();

router.get("/analytics", getEmployeeUserAnalytics);
router.post("/", validate(createEmployeeSchema), createEmployeeUser);
router.get("/", getEmployeeUsers);
router.put("/:userid", validate(updateEmployeeSchema), updateEmployeeByUserId);
router.patch("/:userId/status", toggleEmployeeStatusByUserId);
router.get("/:userId", getEmployeeByUserId);

export default router;
