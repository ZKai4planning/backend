import { Logger } from "winston";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: {
        info: (msg: string, meta?: any) => void;
        warn: (msg: string, meta?: any) => void;
        error: (msg: string, err?: any, meta?: any) => void;
        debug: (msg: string, meta?: any) => void;
      } | undefined;
    }
  }
}

export {};
