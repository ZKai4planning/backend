import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const privateKey = fs.readFileSync(
  path.join(__dirname, "../keys/private.key"),
  "utf-8"
);

export const generateToken = (payload: object) => {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "7d"
  });
};
