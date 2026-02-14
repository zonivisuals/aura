import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ subjectId: string; trackId: string }> };

async function verifyTrackOwnership(trackId: string, subjectId: string, userId: string) {
  const track = await prismaClient.track.findUnique({
    where: { id: trackId },
    include: { subject: { include: { class: { select: { teacherId: true } } } } },
  });

  if (!track || track.subjectId !== subjectId)
    return { error: "Track not found", status: 404 } as const;
  if (track.subject.class.teacherId !== userId)
    return { error: "You don't own this class", status: 403 } as const;

  return { track } as const;
}

/**
 * PUT /api/subjects/[subjectId]/tracks/[trackId] — Update track
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER")
      return NextResponse.json({ error: "Only teachers can update tracks" }, { status: 403 });

    const { subjectId, trackId } = await params;
    const result = await verifyTrackOwnership(trackId, subjectId, session.user.id);
    if ("error" in result)
      return NextResponse.json({ error: result.error }, { status: result.status });

    const body = await request.json();
    const { name, description, isPublished } = body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0)
        return NextResponse.json({ error: "Track name cannot be empty" }, { status: 400 });
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description =
        typeof description === "string" && description.trim().length > 0
          ? description.trim()
          : null;
    }
    if (isPublished !== undefined) {
      if (typeof isPublished !== "boolean")
        return NextResponse.json({ error: "isPublished must be a boolean" }, { status: 400 });
      updateData.isPublished = isPublished;
    }

    if (Object.keys(updateData).length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    const updated = await prismaClient.track.update({
      where: { id: trackId },
      data: updateData,
    });

    return NextResponse.json({ track: updated });
  } catch (err) {
    console.error("Update track error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * DELETE /api/subjects/[subjectId]/tracks/[trackId] — Delete track + all lessons
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER")
      return NextResponse.json({ error: "Only teachers can delete tracks" }, { status: 403 });

    const { subjectId, trackId } = await params;
    const result = await verifyTrackOwnership(trackId, subjectId, session.user.id);
    if ("error" in result)
      return NextResponse.json({ error: result.error }, { status: result.status });

    await prismaClient.track.delete({ where: { id: trackId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete track error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
