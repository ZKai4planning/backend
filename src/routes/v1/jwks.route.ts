import { Router } from "express";
import { keyManager } from "../../security/keyManager";

const router = Router();

router.get("/.well-known/jwks.json", (req, res) => {
  res.json(keyManager.getJWKS());
});

export default router;