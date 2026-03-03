import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "";

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

const MAX_RETRIES = Number(process.env.MONGO_MAX_RETRIES) || 5;
const INITIAL_RETRY_MS = Number(process.env.MONGO_RETRY_MS) || 500;

const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 50,
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 0,
  serverSelectionTimeoutMS:
    Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
  family: 4,
  appName: process.env.APP_NAME || "nodejs-app",
  autoIndex: process.env.NODE_ENV === "production" ? false : true,
};

async function connectWithRetry(retries = MAX_RETRIES) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      await mongoose.connect(MONGO_URI, mongooseOptions);
      console.log("MongoDB connected");
      return;
    } catch (err) {
      attempt += 1;
      const backoff = Math.min(INITIAL_RETRY_MS * 2 ** attempt, 30000);
      const jitter = Math.floor(Math.random() * 100);
      const delay = backoff + jitter;
      console.error(
        `MongoDB connection attempt ${attempt} failed. Retrying in ${delay}ms`,
        err
      );

      if (attempt > retries) {
        console.error("MongoDB connection failed after max retries");
        throw err;
      }

      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

function setupListeners() {
  const conn = mongoose.connection;

  conn.on("connected", () => console.log("MongoDB event: connected"));
  conn.on("reconnected", () => console.log("MongoDB event: reconnected"));
  conn.on("error", (err) => console.error("MongoDB event: error", err));
  conn.on("disconnected", () => console.warn("MongoDB event: disconnected"));
  conn.on("close", () => console.warn("MongoDB event: close"));
  conn.on("timeout", () => console.warn("MongoDB event: timeout"));
}

export async function connectDB(): Promise<void> {
  await connectWithRetry();
  setupListeners();

  // graceful shutdown handlers
  const shutdown = async (signal?: string) => {
    try {
      console.log(`Received ${signal || "shutdown"}, closing MongoDB connection`);
      await mongoose.connection.close(false);
      console.log("MongoDB connection closed");
      if (signal) process.exit(0);
    } catch (err) {
      console.error("Error during MongoDB graceful shutdown:", err);
      process.exit(1);
    }
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGUSR2", () => shutdown("SIGUSR2"));

  process.on("unhandledRejection", async (reason) => {
    console.error("Unhandled Rejection at:", reason);
    await shutdown();
  });

  process.on("uncaughtException", async (err) => {
    console.error("Uncaught Exception thrown:", err);
    await shutdown();
  });
}

export function isMongoConnected(): boolean {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return mongoose.connection.readyState === 1;
}

export async function closeDB(): Promise<void> {
  await mongoose.connection.close(false);
}

