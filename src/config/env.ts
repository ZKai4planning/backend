import dotenv from 'dotenv'
dotenv.config()

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  BREVO_API_KEY: process.env.BREVO_API_KEY as string,
  // REDIS_URL: process.env.REDIS_URL as string,

  DEFAULT_PASSWORD: process.env.DEFAULT_PASSWORD || "Secure@2026",
  LOGO_URL: process.env.LOGO_URL || "https://res.cloudinary.com/dadfvv6st/image/upload/v1773135920/config/nxaqxicswtot5xujgrlp.png",

  // vaultAddr: process.env.VAULT_ADDR || "http://localhost:8200",
  // vaultToken: process.env.VAULT_TOKEN || "myroot",
  // vaultSecretPath: process.env.VAULT_SECRET_PATH || "secret/data/ai4planning",
}
