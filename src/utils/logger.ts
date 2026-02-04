import winston from "winston";
import chalk from "chalk";

const { combine, timestamp, printf } = winston.format;

// 🎨 Color mapping (FastAPI style)
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


const logFormat = printf(({ level, message, timestamp, stack, module }) => {
  return (
    `${chalk.gray(timestamp)} ` +
    `[${levelColor(level)}] ` +
    `${chalk.magenta(module || "app")} : ` +
    `${message}` +
    (stack ? `\n${chalk.red(stack)}` : "")
  );
});



// 🧠 Create logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
  ],
});
