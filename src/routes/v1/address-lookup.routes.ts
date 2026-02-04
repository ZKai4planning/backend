import express from "express";
import { createAddressLookup, getAddressDetailsByUprn, getAddressesByPostcode } from "../../modules/address-lookup/address-lookup.controller";


const router = express.Router();

router.post("/", createAddressLookup);
router.get("/postcode/:postcode", getAddressesByPostcode);

router.get("/by-uprn/:uprn", getAddressDetailsByUprn);

export default router;
