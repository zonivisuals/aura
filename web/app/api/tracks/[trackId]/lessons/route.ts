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

    // For students, include their completion status + classmate positions
    if (!isTeacherOwner) {
      const classId = track.subject.class.id;
      const lessonIds = lessons.map((l) => l.id);

      // Current user's completions
      const completions = await prismaClient.lessonCompletion.findMany({
        where: {
          userId: session.user.id,
          lessonId: { in: lessonIds },
        },
        select: { lessonId: true, finalScore: true },
      });

      const completionMap = new Map(completions.map((c) => [c.lessonId, c]));

      const lessonsWithProgress = lessons.map((lesson) => ({
        ...lesson,
        isCompleted: completionMap.has(lesson.id),
        finalScore: completionMap.get(lesson.id)?.finalScore ?? null,
      }));

      // ── Classmate positions on this track ──
      // Get all enrolled students in the same class (excluding current user)
      const enrollments = await prismaClient.enrollment.findMany({
        where: { classId, userId: { not: session.user.id }, enrollmentType: "STUDENT" },
        select: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Get all classmates' completions for lessons in this track
      const classmateUserIds = enrollments.map((e) => e.user.id);
      const classmateCompletions = classmateUserIds.length > 0
        ? await prismaClient.lessonCompletion.findMany({
            where: {
              userId: { in: classmateUserIds },
              lessonId: { in: lessonIds },
            },
            select: { userId: true, lessonId: true },
          })
        : [];

      // Build a map: lessonId → position for quick lookup
      const lessonPositionMap = new Map(lessons.map((l) => [l.id, l.position]));

      // For each classmate, find their highest completed lesson position
      const userHighestPosition = new Map<string, number>();
      for (const c of classmateCompletions) {
        const pos = lessonPositionMap.get(c.lessonId) ?? 0;
        const current = userHighestPosition.get(c.userId) ?? 0;
        if (pos > current) userHighestPosition.set(c.userId, pos);
      }

      // Build classmates array: each classmate with their checkpoint position
      const classmates = enrollments.map((e) => ({
        id: e.user.id,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        initials: `${e.user.firstName.charAt(0)}${e.user.lastName.charAt(0)}`.toUpperCase(),
        // Position of highest completed lesson, or 0 if none completed
        lastCompletedPosition: userHighestPosition.get(e.user.id) ?? 0,
      }));

      return NextResponse.json({
        lessons: lessonsWithProgress,
        track: { id: track.id, name: track.name, description: track.description },
        classmates,
      });
    }

    return NextResponse.json({ lessons, track: { id: track.id, name: track.name, description: track.description } });
  } catch (err) {
    console.error("List lessons error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
