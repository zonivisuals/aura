import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { getLevelProgress } from "@/lib/gamification";

/**
 * GET /api/gamification/profile?classId=xxx
 * Returns the student's gamification stats for a specific class.
 * If no classId, returns aggregate stats across all classes.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    // Get student attributes
    let attrs;
    if (classId) {
      attrs = await prismaClient.studentAttribute.findUnique({
        where: { userId_classId: { userId: session.user.id, classId } },
      });
    } else {
      // Aggregate across all classes
      const allAttrs = await prismaClient.studentAttribute.findMany({
        where: { userId: session.user.id },
      });
      if (allAttrs.length === 0) {
        attrs = null;
      } else {
        attrs = {
          totalXp: allAttrs.reduce((sum, a) => sum + a.totalXp, 0),
          currentLevel: Math.max(...allAttrs.map((a) => a.currentLevel)),
          lessonsCompleted: allAttrs.reduce((sum, a) => sum + a.lessonsCompleted, 0),
          currentStreak: Math.max(...allAttrs.map((a) => a.currentStreak)),
          longestStreak: Math.max(...allAttrs.map((a) => a.longestStreak)),
          lastActivityDate: allAttrs.reduce((latest, a) => {
            if (!a.lastActivityDate) return latest;
            if (!latest) return a.lastActivityDate;
            return a.lastActivityDate > latest ? a.lastActivityDate : latest;
          }, null as Date | null),
        };
      }
    }

    const stats = attrs
      ? {
          ...getLevelProgress(attrs.totalXp),
          lessonsCompleted: attrs.lessonsCompleted,
          currentStreak: attrs.currentStreak,
          longestStreak: attrs.longestStreak,
          lastActivityDate: attrs.lastActivityDate,
        }
      : {
          level: 1,
          currentXp: 0,
          xpForCurrentLevel: 0,
          xpForNextLevel: 100,
          progressPercent: 0,
          lessonsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
        };

    // Get achievements
    const achievements = await prismaClient.userAchievement.findMany({
      where: { userId: session.user.id },
      include: {
        achievement: {
          select: { name: true, description: true, iconUrl: true },
        },
      },
      orderBy: { earnedAt: "desc" },
    });

    // Get user info
    const user = await prismaClient.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, email: true, avatarUrl: true },
    });

    return NextResponse.json({
      user,
      stats,
      achievements: achievements.map((ua) => ({
        name: ua.achievement.name,
        description: ua.achievement.description,
        iconUrl: ua.achievement.iconUrl,
        earnedAt: ua.earnedAt,
      })),
    });
  } catch (err) {
    console.error("Gamification profile error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
