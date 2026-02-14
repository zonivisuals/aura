import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

type RouteParams = { params: Promise<{ trackId: string }> };

async function verifyTrackOwnership(trackId: string, userId: string) {
  const track = await prismaClient.track.findUnique({
    where: { id: trackId },
    include: { subject: { include: { class: { select: { teacherId: true, id: true } } } } },
  });

  if (!track) return { error: "Track not found", status: 404 } as const;
  if (track.subject.class.teacherId !== userId)
    return { error: "You don't own this class", status: 403 } as const;

  return { track } as const;
}

/**
 * POST /api/tracks/[trackId]/lessons — Create a lesson in a track
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER")
      return NextResponse.json({ error: "Only teachers can create lessons" }, { status: 403 });

    const { trackId } = await params;
    const result = await verifyTrackOwnership(trackId, session.user.id);
    if ("error" in result)
      return NextResponse.json({ error: result.error }, { status: result.status });

    const body = await request.json();
    const { title, description, lessonType, difficulty, xpReward, content, targetAttributes } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const validTypes = ["QUIZ", "YES_NO", "SHORT_ANSWER"];
    if (!lessonType || !validTypes.includes(lessonType))
      return NextResponse.json({ error: "lessonType must be QUIZ, YES_NO, or SHORT_ANSWER" }, { status: 400 });

    const diff = Number(difficulty);
    if (!diff || diff < 1 || diff > 3)
      return NextResponse.json({ error: "difficulty must be 1, 2, or 3" }, { status: 400 });

    if (!content || typeof content !== "object")
      return NextResponse.json({ error: "content is required" }, { status: 400 });

    // Validate content structure per type
    if (lessonType === "QUIZ") {
      if (!content.question || !Array.isArray(content.options) || content.options.length < 2 || content.correctAnswer === undefined)
        return NextResponse.json({ error: "QUIZ content needs question, options (array), and correctAnswer (index)" }, { status: 400 });
    } else if (lessonType === "YES_NO") {
      if (!content.question || content.correctAnswer === undefined)
        return NextResponse.json({ error: "YES_NO content needs question and correctAnswer (boolean)" }, { status: 400 });
    } else if (lessonType === "SHORT_ANSWER") {
      if (!content.question || !Array.isArray(content.keywords) || content.keywords.length === 0)
        return NextResponse.json({ error: "SHORT_ANSWER content needs question and keywords (array)" }, { status: 400 });
    }

    // Auto-assign position: next available
    const lastLesson = await prismaClient.lesson.findFirst({
      where: { trackId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = (lastLesson?.position ?? 0) + 1;

    const lesson = await prismaClient.lesson.create({
      data: {
        id: randomUUID(),
        trackId,
        position,
        title: title.trim(),
        description: description?.trim() || null,
        lessonType,
        difficulty: diff,
        xpReward: xpReward ?? diff * 10,
        content,
        targetAttributes: targetAttributes ?? [],
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (err) {
    console.error("Create lesson error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * GET /api/tracks/[trackId]/lessons — List lessons in a track (ordered by position)
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { trackId } = await params;

    const track = await prismaClient.track.findUnique({
      where: { id: trackId },
      include: { subject: { include: { class: { select: { teacherId: true, id: true } } } } },
    });

    if (!track)
      return NextResponse.json({ error: "Track not found" }, { status: 404 });

    const isTeacherOwner = track.subject.class.teacherId === session.user.id;

    // Students must be enrolled and track must be published
    if (!isTeacherOwner) {
      if (!track.isPublished)
        return NextResponse.json({ error: "Track not available" }, { status: 404 });

      if (session.user.role === "STUDENT") {
        const enrollment = await prismaClient.enrollment.findUnique({
          where: { classId_userId: { classId: track.subject.class.id, userId: session.user.id } },
        });
        if (!enrollment)
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const lessons = await prismaClient.lesson.findMany({
      where: { trackId },
      select: {
        id: true,
        position: true,
        title: true,
        description: true,
        lessonType: true,
        difficulty: true,
        xpReward: true,
        content: isTeacherOwner, // Only teacher sees content (answers)
        targetAttributes: true,
        createdAt: true,
      },
      orderBy: { position: "asc" },
    });

    // For students, include their completion status
    if (!isTeacherOwner) {
      const completions = await prismaClient.lessonCompletion.findMany({
        where: {
          userId: session.user.id,
          lessonId: { in: lessons.map((l) => l.id) },
        },
        select: { lessonId: true, finalScore: true },
      });

      const completionMap = new Map(completions.map((c) => [c.lessonId, c]));

      const lessonsWithProgress = lessons.map((lesson) => ({
        ...lesson,
        isCompleted: completionMap.has(lesson.id),
        finalScore: completionMap.get(lesson.id)?.finalScore ?? null,
      }));

      return NextResponse.json({ lessons: lessonsWithProgress, track: { id: track.id, name: track.name, description: track.description } });
    }

    return NextResponse.json({ lessons, track: { id: track.id, name: track.name, description: track.description } });
  } catch (err) {
    console.error("List lessons error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
