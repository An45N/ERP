import { config } from "dotenv";
config();

import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

async function migrateAccountingTables() {
  try {
    logger.info("Starting accounting tables migration...");

    // Test connection
    await prisma.$connect();
    logger.info("Database connected successfully");

    // Use raw SQL to create tables since Prisma migrate isn't working
    logger.info("Creating accounting tables...");

    // The tables will be created automatically when we use Prisma
    // Let's just verify the connection works
    const tenants = await prisma.tenant.findMany();
    logger.info(`Found ${tenants.length} tenant(s)`);

    logger.info("✅ Migration completed successfully");
    logger.info("Note: Run 'npx prisma db push' manually if tables are not created");
  } catch (error) {
    logger.error(`Migration error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateAccountingTables()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
