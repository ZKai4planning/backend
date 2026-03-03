import winston from "winston";
import chalk from "chalk";
import fs from "fs";
import path from "path";

const { combine, timestamp, printf, errors, json } = winston.format;

// 📁 Ensure logs directory exists
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 🎨 Color mapping
const levelColor = (level: string) => {
  switch (level) {
    case "info":
      return chalk.blue(level.toUpperCase());
    case "warn":
      return chalk.yellow(level.toUpperCase());
    case "error":
      return chalk.red(level.toUpperCase());
    case "debug":
      return chalk.green(level.toUpperCase());
    default:
      return level.toUpperCase();
  }
};

// 🖥 Console format (pretty)
const consoleFormat = printf(
  ({ level, message, timestamp, stack, module, requestId }) =>
    `${chalk.gray(timestamp)} ` +
    `[${levelColor(level)}] ` +
    `${chalk.magenta(module || "app")} ` +
    (requestId ? chalk.cyan(`[${requestId}] `) : "") +
    `${message}` +
    (stack ? `\n${chalk.red(stack)}` : "")
);

// 🧠 Create logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }) // 👈 auto-capture stack traces
  ),

  transports: [
    // 🖥 Console
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // 📄 All logs
    new winston.transports.File({
      filename: path.join(logDir, "app.log"),
      format: json(),
      maxsize: 5_000_000,
      maxFiles: 5,
    }),

    // ❌ Errors only
    new winston.transports.File({
      level: "error",
      filename: path.join(logDir, "error.log"),
      format: json(),
      maxsize: 5_000_000,
      maxFiles: 5,
    }),
  ],
});
