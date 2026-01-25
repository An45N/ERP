import { config } from "dotenv";
config();

import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../generated/prisma";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const params = new URLSearchParams(databaseUrl.split("?")[1] || "");
const urlMatch = databaseUrl.match(/sqlserver:\/\/([^:?]+):?(\d+)?/);

if (!urlMatch) {
  throw new Error("Invalid DATABASE_URL format");
}

const server = urlMatch[1] || "localhost";
const port = parseInt(urlMatch[2] || "1433", 10);

const paramPairs = databaseUrl.split(";").slice(1);
const parsedParams: Record<string, string> = {};
paramPairs.forEach((pair) => {
  const [key, value] = pair.split("=");
  if (key && value) {
    parsedParams[key] = value;
  }
});

const database = parsedParams.database || "";
const user = parsedParams.user || "";
const password = parsedParams.password || "";
const trustServerCertificate = parsedParams.trustServerCertificate === "true";
const encrypt = parsedParams.encrypt === "true";

const sqlConfig = {
  user,
  password,
  database,
  server,
  port,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt,
    trustServerCertificate,
  },
};

const adapter = new PrismaMssql(sqlConfig);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

prisma.$connect().then(() => {
  logger.info("Database connected");
}).catch((error) => {
  logger.error("Database connection failed");
  logger.error(`Error details: ${error instanceof Error ? error.message : String(error)}`);
  logger.error(`Stack: ${error instanceof Error ? error.stack : ""}`);
  logger.error(`Config: server=${sqlConfig.server}, port=${sqlConfig.port}, database=${sqlConfig.database}, user=${sqlConfig.user}`);
  process.exit(1);
});
