import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ lessonId: string }> };

/**
 * GET /api/lessons/[lessonId] — Get a single lesson for a student
 * Returns lesson info + content (without correct answers) for display
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lessonId } = await params;

    const lesson = await prismaClient.lesson.findUnique({
      where: { id: lessonId },
      include: {
        track: {
          include: {
            subject: {
              include: { class: { select: { id: true, teacherId: true } } },
            },
          },
        },
      },
    });

    if (!lesson || !lesson.track.isPublished)
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    const classId = lesson.track.subject.class.id;
    const isTeacher = lesson.track.subject.class.teacherId === session.user.id;

    // Students must be enrolled
    if (!isTeacher) {
      const enrollment = await prismaClient.enrollment.findUnique({
        where: { classId_userId: { classId, userId: session.user.id } },
      });
      if (!enrollment)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build content for display (strip correct answers for students)
    const rawContent = lesson.content as Record<string, unknown>;
    let content: Record<string, unknown> = {};

    if (isTeacher) {
      // Teacher sees everything
      content = rawContent;
    } else {
      // Student sees question + options (no correct answer)
      content = { question: rawContent.question };

      if (lesson.lessonType === "QUIZ") {
        content.options = rawContent.options;
      }
      // YES_NO: just the question, no correctAnswer
      // SHORT_ANSWER: just the question, no keywords or sample answers
    }

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        position: lesson.position,
        title: lesson.title,
        description: lesson.description,
        lessonType: lesson.lessonType,
        difficulty: lesson.difficulty,
        xpReward: lesson.xpReward,
      },
      content,
      trackId: lesson.trackId,
    });
  } catch (err) {
    console.error("Get lesson error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
