import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ classId: string; studentId: string }> };

/**
 * GET /api/analytics/class/[classId]/student/[studentId]
 * Teacher drills into one student's performance in a class.
 *
 * Returns: per-lesson scores, attempt timeline, weakness analysis,
 *          recent attempts list.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER")
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });

    const { classId, studentId } = await params;

    // Verify teacher owns class
    const cls = await prismaClient.class.findUnique({
      where: { id: classId },
      select: { teacherId: true },
    });
    if (!cls || cls.teacherId !== session.user.id)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Verify student is enrolled
    const enrollment = await prismaClient.enrollment.findUnique({
      where: { classId_userId: { classId, userId: studentId } },
    });
    if (!enrollment)
      return NextResponse.json({ error: "Student not in class" }, { status: 404 });

    // Parallel fetches
    const [student, attr, lessons, attempts, completions] = await Promise.all([
      prismaClient.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      }),
      prismaClient.studentAttribute.findUnique({
        where: { userId_classId: { userId: studentId, classId } },
      }),
      prismaClient.lesson.findMany({
        where: { track: { subject: { classId } } },
        select: {
          id: true,
          title: true,
          position: true,
          difficulty: true,
          lessonType: true,
          xpReward: true,
          targetAttributes: true,
          track: { select: { id: true, name: true } },
        },
        orderBy: { position: "asc" },
      }),
      prismaClient.lessonAttempt.findMany({
        where: {
          userId: studentId,
          lesson: { track: { subject: { classId } } },
        },
        select: {
          id: true,
          lessonId: true,
          isCorrect: true,
          score: true,
          timeSpentSeconds: true,
          identifiedWeaknesses: true,
          attemptedAt: true,
        },
        orderBy: { attemptedAt: "desc" },
      }),
      prismaClient.lessonCompletion.findMany({
        where: {
          userId: studentId,
          lesson: { track: { subject: { classId } } },
        },
        select: {
          lessonId: true,
          finalScore: true,
          attemptsCount: true,
          completedAt: true,
        },
      }),
    ]);

    if (!student)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Build completion map
    const completionMap = new Map(completions.map((c) => [c.lessonId, c]));

    // Per-lesson performance
    const lessonPerformance = lessons.map((l) => {
      const lAttempts = attempts.filter((a) => a.lessonId === l.id);
      const comp = completionMap.get(l.id);
      const avgScore =
        lAttempts.length > 0
          ? Math.round(lAttempts.reduce((s, a) => s + (a.score ?? 0), 0) / lAttempts.length)
          : null;

      return {
        lessonId: l.id,
        title: l.title,
        trackName: l.track.name,
        difficulty: l.difficulty,
        lessonType: l.lessonType,
        attempts: lAttempts.length,
        avgScore,
        finalScore: comp?.finalScore ?? null,
        completed: !!comp,
        completedAt: comp?.completedAt?.toISOString() ?? null,
      };
    });

    // Score timeline (attempts over time, last 30)
    const scoreTimeline = attempts.slice(0, 50).reverse().map((a) => ({
      date: a.attemptedAt.toISOString(),
      score: a.score ?? 0,
      isCorrect: a.isCorrect,
    }));

    // Weakness frequency map
    const weaknessFreq = new Map<string, number>();
    for (const a of attempts) {
      for (const w of a.identifiedWeaknesses) {
        weaknessFreq.set(w, (weaknessFreq.get(w) ?? 0) + 1);
      }
    }
    const weaknesses = [...weaknessFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([attribute, occurrences]) => ({ attribute, occurrences }));

    // Recent attempts (last 20 for display)
    const recentAttempts = attempts.slice(0, 20).map((a) => {
      const lesson = lessons.find((l) => l.id === a.lessonId);
      return {
        id: a.id,
        lessonTitle: lesson?.title ?? "Unknown",
        trackName: lesson?.track.name ?? "",
        score: a.score,
        isCorrect: a.isCorrect,
        timeSpentSeconds: a.timeSpentSeconds,
        attemptedAt: a.attemptedAt.toISOString(),
      };
    });

    return NextResponse.json({
      student,
      stats: {
        totalXp: attr?.totalXp ?? 0,
        level: attr?.currentLevel ?? 1,
        lessonsCompleted: completions.length,
        totalLessons: lessons.length,
        completionPercent:
          lessons.length > 0
            ? Math.round((completions.length / lessons.length) * 100)
            : 0,
        totalAttempts: attempts.length,
        currentStreak: attr?.currentStreak ?? 0,
        longestStreak: attr?.longestStreak ?? 0,
        lastActivityDate: attr?.lastActivityDate?.toISOString() ?? null,
        avgScore:
          attempts.length > 0
            ? Math.round(
                attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length
              )
            : 0,
      },
      lessonPerformance,
      scoreTimeline,
      weaknesses,
      recentAttempts,
    });
  } catch (err) {
    console.error("Student analytics error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
