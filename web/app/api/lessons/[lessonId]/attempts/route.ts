import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

type RouteParams = { params: Promise<{ lessonId: string }> };

/**
 * POST /api/lessons/[lessonId]/attempts — Student submits an answer
 *
 * Body: { userAnswer: any, timeSpentSeconds?: number }
 *
 * For QUIZ: userAnswer = index (number)
 * For YES_NO: userAnswer = boolean
 * For SHORT_ANSWER: userAnswer = string
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT")
      return NextResponse.json({ error: "Only students can attempt lessons" }, { status: 403 });

    const { lessonId } = await params;

    // Get lesson with track → subject → class for access check
    const lesson = await prismaClient.lesson.findUnique({
      where: { id: lessonId },
      include: {
        track: {
          include: {
            subject: {
              include: { class: { select: { id: true } } },
            },
          },
        },
      },
    });

    if (!lesson || !lesson.track.isPublished)
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    // Verify student is enrolled
    const classId = lesson.track.subject.class.id;
    const enrollment = await prismaClient.enrollment.findUnique({
      where: { classId_userId: { classId, userId: session.user.id } },
    });
    if (!enrollment)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // Check sequential unlock: all previous lessons in this track must be completed
    if (lesson.position > 1) {
      const previousLessons = await prismaClient.lesson.findMany({
        where: { trackId: lesson.trackId, position: { lt: lesson.position } },
        select: { id: true },
      });

      const completedCount = await prismaClient.lessonCompletion.count({
        where: {
          userId: session.user.id,
          lessonId: { in: previousLessons.map((l) => l.id) },
        },
      });

      if (completedCount < previousLessons.length)
        return NextResponse.json({ error: "Complete previous lessons first" }, { status: 403 });
    }

    const body = await request.json();
    const { userAnswer, timeSpentSeconds } = body;

    if (userAnswer === undefined || userAnswer === null)
      return NextResponse.json({ error: "userAnswer is required" }, { status: 400 });

    // Evaluate answer
    const content = lesson.content as Record<string, unknown>;
    let isCorrect = false;
    let score = 0;
    const identifiedWeaknesses: string[] = [];

    if (lesson.lessonType === "QUIZ") {
      isCorrect = userAnswer === content.correctAnswer;
      score = isCorrect ? 100 : 0;
    } else if (lesson.lessonType === "YES_NO") {
      isCorrect = userAnswer === content.correctAnswer;
      score = isCorrect ? 100 : 0;
    } else if (lesson.lessonType === "SHORT_ANSWER") {
      // Keyword matching: check how many keywords appear in the answer
      const keywords = (content.keywords as string[]) || [];
      const answerLower = String(userAnswer).toLowerCase();
      const matched = keywords.filter((kw) =>
        answerLower.includes(kw.toLowerCase())
      );
      score = keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0;
      isCorrect = score >= 50; // 50%+ keyword match = correct
    }

    // Track weaknesses if incorrect
    if (!isCorrect && lesson.targetAttributes.length > 0) {
      identifiedWeaknesses.push(...lesson.targetAttributes);
    }

    // Create attempt
    const attempt = await prismaClient.lessonAttempt.create({
      data: {
        id: randomUUID(),
        lessonId,
        userId: session.user.id,
        userAnswer,
        isCorrect,
        score,
        timeSpentSeconds: timeSpentSeconds ?? null,
        identifiedWeaknesses,
      },
    });

    // If correct and not already completed → create completion + award XP
    let completion = null;
    let xpAwarded = 0;

    if (isCorrect) {
      const existingCompletion = await prismaClient.lessonCompletion.findUnique({
        where: { lessonId_userId: { lessonId, userId: session.user.id } },
      });

      if (!existingCompletion) {
        // Count total attempts for this lesson
        const attemptsCount = await prismaClient.lessonAttempt.count({
          where: { lessonId, userId: session.user.id },
        });

        completion = await prismaClient.lessonCompletion.create({
          data: {
            id: randomUUID(),
            lessonId,
            userId: session.user.id,
            finalScore: score,
            attemptsCount,
          },
        });

        xpAwarded = lesson.xpReward;

        // Update student attributes (XP, lessons completed)
        await prismaClient.studentAttribute.upsert({
          where: { userId_classId: { userId: session.user.id, classId } },
          create: {
            id: randomUUID(),
            userId: session.user.id,
            classId,
            totalXp: xpAwarded,
            lessonsCompleted: 1,
            lastActivityDate: new Date(),
          },
          update: {
            totalXp: { increment: xpAwarded },
            lessonsCompleted: { increment: 1 },
            lastActivityDate: new Date(),
          },
        });
      }
    }

    // Build explanation for feedback
    const explanation = (content.explanation as string) ?? null;

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        isCorrect,
        score,
        identifiedWeaknesses,
      },
      completion: completion ? { id: completion.id, xpAwarded } : null,
      explanation,
    });
  } catch (err) {
    console.error("Lesson attempt error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
