/**
 * Seed script for achievements.
 * Run: DOTENV_CONFIG_PATH=.env.local npx tsx --require dotenv/config lib/scripts/seed-achievements.ts
 */
import { prismaClient } from "@/lib/prisma/prisma";
import { ACHIEVEMENT_SEED_DATA } from "@/lib/gamification";
import { randomUUID } from "crypto";

async function main() {
  console.log("🌱 Seeding achievements...");

  let created = 0;
  let skipped = 0;

  for (const data of ACHIEVEMENT_SEED_DATA) {
    const existing = await prismaClient.achievement.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      console.log(`  ✓ "${data.name}" already exists`);
      skipped++;
      continue;
    }

    await prismaClient.achievement.create({
      data: {
        id: randomUUID(),
        name: data.name,
        description: data.description,
        iconUrl: data.iconUrl ?? null,
        xpRequirement: data.xpRequirement ?? null,
        criteria: { type: data.name },
      },
    });

    console.log(`  ✅ Created "${data.name}"`);
    created++;
  }

  console.log(`\n🎉 Done! Created ${created}, skipped ${skipped} (of ${ACHIEVEMENT_SEED_DATA.length} total).`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
