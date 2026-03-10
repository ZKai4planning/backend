import vault from "node-vault";
import { env } from "./env";

const client = vault({
  endpoint: env.vaultAddr,
  token: env.vaultToken,
});

let cachedKey: Buffer | null = null;

export async function getEncryptionKey(): Promise<Buffer> {
  if (cachedKey) return cachedKey;

  const secret = await client.read(env.vaultSecretPath);

  const key = secret.data.data.encryption_key;

  cachedKey = Buffer.from(key, "base64");

  return cachedKey;
}