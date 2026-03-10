import crypto from "crypto";
import { getEncryptionKey } from "../config/vault";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

/* ------------------------------------------------ */
/* Hash Utility */
/* ------------------------------------------------ */

export const hashValue = (value?: string) => {
  if (!value) return undefined;

  return crypto
    .createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex");
};

/* ------------------------------------------------ */
/* Encryption Utility */
/* ------------------------------------------------ */

export const encryptText = async (text: string) => {

  const key = await getEncryptionKey();

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGO, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    content: encrypted,
    tag: tag.toString("hex")
  };
};

/* ------------------------------------------------ */
/* Decryption Utility */
/* ------------------------------------------------ */

export const decryptText = async (payload: any) => {

  if (!payload?.iv) return payload;

  const key = await getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(payload.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "hex"));

  let decrypted = decipher.update(payload.content, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
