// Load .env.local for standalone script execution (Next.js does this automatically for the app)
import { config } from "dotenv";
config({ path: ".env.local" });

import { prismaClient as prisma } from "../prisma/prisma";

const mockTests = [
  { test: "First test entry" },
  { test: "Second test entry" },
  { test: "Hello from seed script" },
  { test: "Testing Prisma with Supabase" },
  { test: "Mock data for development" },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.test.deleteMany();
  console.log("🗑️  Cleared existing test data");

  // Create mock test data
  for (const data of mockTests) {
    const test = await prisma.test.create({
      data,
    });
    console.log(`✅ Created test: ${test.id} - "${test.test}"`);
  }

  console.log(`\n🎉 Seed completed! Created ${mockTests.length} test records.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
