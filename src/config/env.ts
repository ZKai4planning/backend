import dotenv from 'dotenv'
dotenv.config()

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  BREVO_API_KEY: process.env.BREVO_API_KEY as string,
  // REDIS_URL: process.env.REDIS_URL as string,

  // vaultAddr: process.env.VAULT_ADDR!,
  // vaultToken: process.env.VAULT_TOKEN!,
  // vaultSecretPath: process.env.VAULT_SECRET_PATH!,
}
