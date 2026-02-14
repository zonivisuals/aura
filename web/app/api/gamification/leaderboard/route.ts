import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { getLevelProgress } from "@/lib/gamification";

/**
 * GET /api/gamification/leaderboard?classId=xxx
 * Returns ranked list of students in a class by XP.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId)
      return NextResponse.json({ error: "classId is required" }, { status: 400 });

    // Verify user has access (teacher owns or student enrolled)
    const cls = await prismaClient.class.findUnique({
      where: { id: classId },
      select: { teacherId: true },
    });

    if (!cls)
      return NextResponse.json({ error: "Class not found" }, { status: 404 });

    if (cls.teacherId !== session.user.id) {
      const enrollment = await prismaClient.enrollment.findUnique({
        where: { classId_userId: { classId, userId: session.user.id } },
      });
      if (!enrollment)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all student attributes in this class, ordered by XP
    const studentAttrs = await prismaClient.studentAttribute.findMany({
      where: { classId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { totalXp: "desc" },
    });

    const leaderboard = studentAttrs.map((sa, index) => {
      const levelInfo = getLevelProgress(sa.totalXp);
      return {
        rank: index + 1,
        userId: sa.user.id,
        firstName: sa.user.firstName,
        lastName: sa.user.lastName,
        avatarUrl: sa.user.avatarUrl,
        totalXp: sa.totalXp,
        level: levelInfo.level,
        lessonsCompleted: sa.lessonsCompleted,
        currentStreak: sa.currentStreak,
        isCurrentUser: sa.user.id === session.user.id,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
