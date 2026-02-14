import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { getLevelProgress } from "@/lib/gamification";

/**
 * GET /api/analytics/student/performance?classId=xxx
 *
 * Returns the student's own performance charts data:
 *  - score timeline, per-lesson scores, weakness heatmap,
 *    attempt history with question details.
 *
 * If no classId, aggregates across all enrolled classes.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    // Build lesson filter
    const lessonFilter = classId
      ? { track: { subject: { classId } } }
      : {
          track: {
            subject: {
              class: {
                enrollments: { some: { userId: session.user.id } },
              },
            },
          },
        };

    const [attempts, completions, attrs] = await Promise.all([
      prismaClient.lessonAttempt.findMany({
        where: { userId: session.user.id, lesson: lessonFilter },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              position: true,
              lessonType: true,
              difficulty: true,
              content: true,
              xpReward: true,
              track: {
                select: {
                  id: true,
                  name: true,
                  subject: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { attemptedAt: "desc" },
      }),
      prismaClient.lessonCompletion.findMany({
        where: { userId: session.user.id, lesson: lessonFilter },
      }),
      classId
        ? prismaClient.studentAttribute.findUnique({
            where: { userId_classId: { userId: session.user.id, classId } },
          })
        : prismaClient.studentAttribute
            .findMany({ where: { userId: session.user.id } })
            .then((all) => {
              if (all.length === 0) return null;
              return {
                totalXp: all.reduce((s, a) => s + a.totalXp, 0),
                currentLevel: Math.max(...all.map((a) => a.currentLevel)),
                lessonsCompleted: all.reduce((s, a) => s + a.lessonsCompleted, 0),
                currentStreak: Math.max(...all.map((a) => a.currentStreak)),
                longestStreak: Math.max(...all.map((a) => a.longestStreak)),
              };
            }),
    ]);

    // Score timeline (all attempts, chronological)
    const scoreTimeline = [...attempts].reverse().map((a) => ({
      date: a.attemptedAt.toISOString(),
      score: a.score ?? 0,
      isCorrect: a.isCorrect,
      lessonTitle: a.lesson.title,
    }));

    // Weakness frequency
    const weaknessFreq = new Map<string, number>();
    for (const a of attempts) {
      for (const w of a.identifiedWeaknesses) {
        weaknessFreq.set(w, (weaknessFreq.get(w) ?? 0) + 1);
      }
    }
    const weaknesses = [...weaknessFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([attribute, occurrences]) => ({ attribute, occurrences }));

    // Per-lesson avg scores (for bar chart)
    const lessonScores = new Map<string, { title: string; scores: number[] }>();
    for (const a of attempts) {
      if (!lessonScores.has(a.lessonId)) {
        lessonScores.set(a.lessonId, { title: a.lesson.title, scores: [] });
      }
      lessonScores.get(a.lessonId)!.scores.push(a.score ?? 0);
    }
    const perLessonScores = [...lessonScores.entries()].map(([id, data]) => ({
      lessonId: id,
      title: data.title,
      avgScore: Math.round(
        data.scores.reduce((s, v) => s + v, 0) / data.scores.length
      ),
      attempts: data.scores.length,
    }));

    // Attempt history with question text (last 50)
    const attemptHistory = attempts.slice(0, 50).map((a) => {
      const content = a.lesson.content as Record<string, unknown>;
      return {
        id: a.id,
        lessonId: a.lessonId,
        lessonTitle: a.lesson.title,
        trackName: a.lesson.track.name,
        subjectName: a.lesson.track.subject.name,
        lessonType: a.lesson.lessonType,
        difficulty: a.lesson.difficulty,
        question: (content?.question as string) ?? "",
        userAnswer: a.userAnswer,
        isCorrect: a.isCorrect,
        score: a.score,
        timeSpentSeconds: a.timeSpentSeconds,
        identifiedWeaknesses: a.identifiedWeaknesses,
        attemptedAt: a.attemptedAt.toISOString(),
      };
    });

    // Level progress
    const totalXp = (attrs as { totalXp?: number })?.totalXp ?? 0;
    const levelProgress = getLevelProgress(totalXp);

    return NextResponse.json({
      stats: {
        totalAttempts: attempts.length,
        correctAttempts: attempts.filter((a) => a.isCorrect).length,
        totalCompletions: completions.length,
        avgScore:
          attempts.length > 0
            ? Math.round(
                attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length
              )
            : 0,
        ...levelProgress,
        currentStreak: (attrs as { currentStreak?: number })?.currentStreak ?? 0,
        longestStreak: (attrs as { longestStreak?: number })?.longestStreak ?? 0,
      },
      scoreTimeline,
      weaknesses,
      perLessonScores,
      attemptHistory,
    });
  } catch (err) {
    console.error("Student performance error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
