import express from "express";
import cors from "cors";

import routes from "./routes"; 
import swaggerUi from "swagger-ui-express";
import swaggerFile from "./swagger.json";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";
import { keyManager } from "./security/keyManager";

const app = express();
keyManager.rotateKeysIfNeeded();


const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header)
      if (!origin) return callback(null, true);
      // In dev, allow any origin to avoid local CORS issues
      if (!isProd) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(requestLogger);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerFile, {
    swaggerOptions: {
      deepLinking: true,
      displayRequestDuration: true,

      showExtensions: true,
      showCommonExtensions: true,

      filter: true, // search/filter APIs

      tryItOutEnabled: true,

      persistAuthorization: true, // keep JWT token after refresh

      // tagsSorter: "alpha",
      // operationsSorter: "alpha",
    }
  }));

app.use("/api", routes); 

app.use(errorHandler);

export default app;
