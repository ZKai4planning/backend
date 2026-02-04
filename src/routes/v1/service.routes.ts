import { Router } from "express";
import {
  createService,
  updateService,
  getServiceList,
  getServiceDetails,
  getAllServiceList,
  removeServiceImages
} from "../../modules/service-types/service.controller";
import upload from "../../middlewares/multer";

const router = Router();



router.post(
  "/",
  upload.array("images"), // 👈 MUST match form field name
  createService
);               


router.put("/:serviceId", updateService);        // Update
router.get("/", getServiceList);    

router.get("/all", getAllServiceList);  // List (id + name)
router.get("/:serviceId", getServiceDetails);    // Full details

router.delete("/:serviceId/images", removeServiceImages);

export default router;
