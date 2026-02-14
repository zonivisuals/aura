import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ classId: string }> };

/**
 * GET /api/analytics/class/[classId] — Teacher analytics for a class
 *
 * Returns: class overview stats, per-student breakdown, engagement metrics,
 *          at-risk students, and recent activity.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER")
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });

    const { classId } = await params;

    // Verify ownership
    const cls = await prismaClient.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, teacherId: true },
    });
    if (!cls || cls.teacherId !== session.user.id)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Parallel queries for speed
    const [enrollments, studentAttrs, lessons, allAttempts, allCompletions] =
      await Promise.all([
        // Enrolled students
        prismaClient.enrollment.findMany({
          where: { classId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        }),
        // Student attributes for this class
        prismaClient.studentAttribute.findMany({
          where: { classId },
        }),
        // All lessons in this class (through subjects → tracks → lessons)
        prismaClient.lesson.findMany({
          where: {
            track: { subject: { classId } },
          },
          select: { id: true, title: true, trackId: true, difficulty: true, xpReward: true },
        }),
        // All attempts for lessons in this class
        prismaClient.lessonAttempt.findMany({
          where: {
            lesson: { track: { subject: { classId } } },
          },
          select: {
            id: true,
            userId: true,
            lessonId: true,
            isCorrect: true,
            score: true,
            attemptedAt: true,
          },
          orderBy: { attemptedAt: "desc" },
        }),
        // All completions for lessons in this class
        prismaClient.lessonCompletion.findMany({
          where: {
            lesson: { track: { subject: { classId } } },
          },
          select: {
            userId: true,
            lessonId: true,
            finalScore: true,
            attemptsCount: true,
            completedAt: true,
          },
        }),
      ]);

    const totalLessons = lessons.length;
    const totalStudents = enrollments.length;

    // ── Class-wide stats ──
    const totalAttempts = allAttempts.length;
    const correctAttempts = allAttempts.filter((a) => a.isCorrect).length;
    const classAvgScore =
      allAttempts.length > 0
        ? Math.round(
            allAttempts.reduce((s, a) => s + (a.score ?? 0), 0) / allAttempts.length
          )
        : 0;
    const classCompletionRate =
      totalStudents > 0 && totalLessons > 0
        ? Math.round(
            (allCompletions.length / (totalStudents * totalLessons)) * 100
          )
        : 0;

    // ── Per-student breakdown ──
    const attrMap = new Map(studentAttrs.map((a) => [a.userId, a]));
    const completionsByUser = new Map<string, number>();
    const scoresByUser = new Map<string, number[]>();

    for (const c of allCompletions) {
      completionsByUser.set(c.userId, (completionsByUser.get(c.userId) ?? 0) + 1);
    }
    for (const a of allAttempts) {
      const arr = scoresByUser.get(a.userId) ?? [];
      arr.push(a.score ?? 0);
      scoresByUser.set(a.userId, arr);
    }

    const students = enrollments.map((e) => {
      const attr = attrMap.get(e.user.id);
      const completed = completionsByUser.get(e.user.id) ?? 0;
      const scores = scoresByUser.get(e.user.id) ?? [];
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : 0;
      const completionPct =
        totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

      return {
        id: e.user.id,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        email: e.user.email,
        avatarUrl: e.user.avatarUrl,
        totalXp: attr?.totalXp ?? 0,
        level: attr?.currentLevel ?? 1,
        lessonsCompleted: completed,
        completionPercent: completionPct,
        avgScore,
        currentStreak: attr?.currentStreak ?? 0,
        lastActivityDate: attr?.lastActivityDate?.toISOString() ?? null,
        totalAttempts: scores.length,
      };
    });

    // ── At-risk students (low completion + low avg score or inactive 7+ days) ──
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const atRiskStudents = students
      .filter((s) => {
        const inactive =
          !s.lastActivityDate || new Date(s.lastActivityDate) < sevenDaysAgo;
        const lowCompletion = s.completionPercent < 30;
        const lowScore = s.avgScore < 50 && s.totalAttempts > 0;
        return inactive || lowCompletion || lowScore;
      })
      .map((s) => ({
        ...s,
        risks: [
          ...(!s.lastActivityDate || new Date(s.lastActivityDate) < sevenDaysAgo
            ? ["Inactive 7+ days"]
            : []),
          ...(s.completionPercent < 30 ? ["Low completion"] : []),
          ...(s.avgScore < 50 && s.totalAttempts > 0 ? ["Low avg score"] : []),
        ],
      }));

    // ── Daily activity (last 14 days) ──
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const dailyActivity: { date: string; attempts: number; completions: number }[] = [];

    for (let i = 13; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().slice(0, 10);
      const dayAttempts = allAttempts.filter(
        (a) => a.attemptedAt.toISOString().slice(0, 10) === dayStr
      ).length;
      const dayCompletions = allCompletions.filter(
        (c) => c.completedAt.toISOString().slice(0, 10) === dayStr
      ).length;
      dailyActivity.push({ date: dayStr, attempts: dayAttempts, completions: dayCompletions });
    }

    // ── Score distribution ──
    const scoreDistribution = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];
    for (const a of allAttempts) {
      const s = a.score ?? 0;
      if (s <= 20) scoreDistribution[0].count++;
      else if (s <= 40) scoreDistribution[1].count++;
      else if (s <= 60) scoreDistribution[2].count++;
      else if (s <= 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    }

    return NextResponse.json({
      className: cls.name,
      overview: {
        totalStudents,
        totalLessons,
        totalAttempts,
        correctAttempts,
        classAvgScore,
        classCompletionRate,
        accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      },
      students,
      atRiskStudents,
      dailyActivity,
      scoreDistribution,
    });
  } catch (err) {
    console.error("Class analytics error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
