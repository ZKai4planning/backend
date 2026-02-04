import dotenv from "dotenv";
dotenv.config(); // ✅ MUST be first

import axios from "axios";

if (!process.env.BREVO_API_KEY) {
  throw new Error("❌ BREVO_API_KEY is missing");
}

export const brevoClient = axios.create({
  baseURL: "https://api.brevo.com/v3",
  headers: {
    "Content-Type": "application/json",
    "api-key": process.env.BREVO_API_KEY,
  },
});
