import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/gamification/achievements
 * Returns all achievements with earned status for the current user.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all achievements
    const allAchievements = await prismaClient.achievement.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Get user's earned achievements
    const earned = await prismaClient.userAchievement.findMany({
      where: { userId: session.user.id },
      select: { achievementId: true, earnedAt: true },
    });
    const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

    const achievements = allAchievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      iconUrl: a.iconUrl,
      isEarned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) ?? null,
    }));

    return NextResponse.json({
      achievements,
      earnedCount: earned.length,
      totalCount: allAchievements.length,
    });
  } catch (err) {
    console.error("Achievements error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
