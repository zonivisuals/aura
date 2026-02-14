import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ trackId: string; lessonId: string }> };

async function verifyLessonOwnership(lessonId: string, trackId: string, userId: string) {
  const lesson = await prismaClient.lesson.findUnique({
    where: { id: lessonId },
    include: { track: { include: { subject: { include: { class: { select: { teacherId: true } } } } } } },
  });

  if (!lesson || lesson.trackId !== trackId)
    return { error: "Lesson not found", status: 404 } as const;
  if (lesson.track.subject.class.teacherId !== userId)
    return { error: "You don't own this class", status: 403 } as const;

  return { lesson } as const;
}

/**
 * PUT /api/tracks/[trackId]/lessons/[lessonId] — Update a lesson
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER")
      return NextResponse.json({ error: "Only teachers can update lessons" }, { status: 403 });

    const { trackId, lessonId } = await params;
    const result = await verifyLessonOwnership(lessonId, trackId, session.user.id);
    if ("error" in result)
      return NextResponse.json({ error: result.error }, { status: result.status });

    const body = await request.json();
    const { title, description, lessonType, difficulty, xpReward, content, targetAttributes } = body;
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0)
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = typeof description === "string" && description.trim().length > 0 ? description.trim() : null;
    }
    if (lessonType !== undefined) {
      const validTypes = ["QUIZ", "YES_NO", "SHORT_ANSWER"];
      if (!validTypes.includes(lessonType))
        return NextResponse.json({ error: "Invalid lessonType" }, { status: 400 });
      updateData.lessonType = lessonType;
    }
    if (difficulty !== undefined) {
      const diff = Number(difficulty);
      if (diff < 1 || diff > 3)
        return NextResponse.json({ error: "difficulty must be 1, 2, or 3" }, { status: 400 });
      updateData.difficulty = diff;
    }
    if (xpReward !== undefined) updateData.xpReward = Number(xpReward);
    if (content !== undefined) updateData.content = content;
    if (targetAttributes !== undefined) updateData.targetAttributes = targetAttributes;

    if (Object.keys(updateData).length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    const updated = await prismaClient.lesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    return NextResponse.json({ lesson: updated });
  } catch (err) {
    console.error("Update lesson error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * DELETE /api/tracks/[trackId]/lessons/[lessonId] — Delete a lesson and reorder remaining
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER")
      return NextResponse.json({ error: "Only teachers can delete lessons" }, { status: 403 });

    const { trackId, lessonId } = await params;
    const result = await verifyLessonOwnership(lessonId, trackId, session.user.id);
    if ("error" in result)
      return NextResponse.json({ error: result.error }, { status: result.status });

    const deletedPosition = result.lesson.position;

    await prismaClient.lesson.delete({ where: { id: lessonId } });

    // Reorder lessons after the deleted one
    await prismaClient.$executeRawUnsafe(
      `UPDATE lessons SET position = position - 1 WHERE track_id = $1 AND position > $2`,
      trackId,
      deletedPosition
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete lesson error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
