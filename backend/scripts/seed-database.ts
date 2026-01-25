import { prisma } from "../src/lib/prisma.js";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

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
  console.log(`✅ Tenant created: ${tenant.code} (${tenant.id})`);

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
      fiscalYearStart: 1,
      isActive: true,
    },
  });
  console.log(`✅ Company created: ${company.code} (${company.id})`);

  // Create admin user
  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "admin@erp.local",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@erp.local",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email} (${adminUser.id})`);

  console.log("\n📋 Summary:");
  console.log(`   Tenant ID: ${tenant.id}`);
  console.log(`   Company ID: ${company.id}`);
  console.log(`   Admin User ID: ${adminUser.id}`);
  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📝 You can now login with:");
  console.log(`   Email: admin@erp.local`);
  console.log(`   Password: Admin123!`);
  console.log(`   Tenant Code: DEFAULT`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
