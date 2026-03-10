import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { StringValue } from "ms";
import { keyManager } from "./keyManager";
import { JWT_CONFIG } from "../config/jwt.config";

export const generateToken = (payload: JwtPayload) => {
  const { key, kid } = keyManager.getCurrentPrivateKey();

  const options: SignOptions = {
    algorithm: "RS256",
    expiresIn: JWT_CONFIG.TOKEN_EXPIRY as StringValue,
    keyid: kid
  };

  return jwt.sign(payload, key, options);
};

export const verifyToken = (token: string) => {
  const decoded: any = jwt.decode(token, { complete: true });

  if (!decoded?.header?.kid) {
    throw new Error("Token missing kid");
  }

  const publicKey = keyManager.getPublicKey(decoded.header.kid);

  if (!publicKey) {
    throw new Error("Public key not found");
  }

  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"]
  });
};