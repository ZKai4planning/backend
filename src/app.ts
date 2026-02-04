import express from "express";
import cors from "cors";

import routes from "./routes"; 
import swaggerUi from "swagger-ui-express";
import swaggerFile from "./swagger.json";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);

app.use(express.json());
app.use(requestLogger);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use("/api", routes); 

app.use(errorHandler);

export default app;
