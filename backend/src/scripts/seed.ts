import { config } from "dotenv";
config();

import { prisma } from "../lib/prisma";
import { AuthService } from "../lib/auth";
import { logger } from "../lib/logger";

async function seed() {
  try {
    logger.info("Starting database seed...");

    // Create default tenant
    const tenant = await prisma.tenant.upsert({
      where: { code: "DEFAULT" },
      update: {},
      create: {
        code: "DEFAULT",
        name: "Default Tenant",
        isActive: true,
      },
    });

    logger.info(`Tenant created: ${tenant.code}`);

    // Create default roles
    const adminRole = await prisma.role.upsert({
      where: { code: "ADMIN" },
      update: {},
      create: {
        code: "ADMIN",
        name: "Administrator",
        description: "Full system access",
        isActive: true,
      },
    });

    const userRole = await prisma.role.upsert({
      where: { code: "USER" },
      update: {},
      create: {
        code: "USER",
        name: "User",
        description: "Standard user access",
        isActive: true,
      },
    });

    logger.info("Roles created: ADMIN, USER");

    // Create admin user
    const adminEmail = "admin@erp.local";
    const existingAdmin = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: adminEmail,
        },
      },
    });

    if (!existingAdmin) {
      const passwordHash = await AuthService.hashPassword("Admin123!");

      const adminUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          firstName: "System",
          lastName: "Administrator",
          isActive: true,
        },
      });

      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });

      logger.info(`Admin user created: ${adminEmail}`);
      logger.info("Default password: Admin123!");
    } else {
      logger.info("Admin user already exists");
    }

    // Create default company
    const company = await prisma.company.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: "MAIN",
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        code: "MAIN",
        name: "Main Company",
        legalName: "Main Company Ltd",
        currency: "MUR",
        country: "MU",
        isActive: true,
      },
    });

    logger.info(`Company created: ${company.code}`);

    logger.info("✅ Database seeding completed successfully");
  } catch (error) {
    logger.error(`Seed error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
