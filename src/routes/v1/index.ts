import { Router } from "express";


import authRoutes from "./auth.routes";
import profileRoutes from "./userprofile.routes";
import serviceRoutes from "./service.routes";
import roleRoutes from "./role.routes";
import addresslookupRoutes from "./address-lookup.routes";
import configurationRoutes from "./config.routes";
import adminUserRoutes from "./adminuser.routes";
import loginroutes from "./adminauth.routes";


const router = Router();

router.use("/auth", authRoutes);
router.use("/users", authRoutes);


router.use("/profile", profileRoutes);
router.use("/services", serviceRoutes);
router.use("/roles", roleRoutes);

router.use("/address-lookup", addresslookupRoutes);

router.use("/configuration", configurationRoutes);
router.use("/admin/users", adminUserRoutes);
router.use("/admin/auth", loginroutes);


export default router;
