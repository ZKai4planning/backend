import { Router } from "express";


import authRoutes from "./auth.routes";
import profileRoutes from "./userprofile.routes";
import roleRoutes from "./role.routes";
import addresslookupRoutes from "./address-lookup.routes";
import configurationRoutes from "./config.routes";
import adminUserRoutes from "./adminuser.routes";
import loginroutes from "./adminauth.routes";
import employeeAuthRoutes from "./employeeauth.routes";
import employeeUserRoutes from "./employeeuser.routes";

import servicesRoutes from "./service.routes";
import subservicesRoutes from "./subservices.routes";
import analyticsRoutes from "./service.analytics.routes";


const router = Router();

router.use("/auth", authRoutes);
router.use("/users", authRoutes);


router.use("/profile", profileRoutes);
router.use("/services", servicesRoutes);
router.use("/subservices", subservicesRoutes);
router.use("/service-analytics", analyticsRoutes);
router.use("/roles", roleRoutes);

router.use("/address-lookup", addresslookupRoutes);

router.use("/configuration", configurationRoutes);
router.use("/admin/users", adminUserRoutes);
router.use("/admin/auth", loginroutes);
router.use("/employee/auth", employeeAuthRoutes);
router.use("/employee/users", employeeUserRoutes);


export default router;
