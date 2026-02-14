import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ subjectId: string }> };

/**
 * Helper: verify subject exists and teacher owns the parent class
 */
async function verifySubjectOwnership(subjectId: string, userId: string) {
  const subject = await prismaClient.subject.findUnique({
    where: { id: subjectId },
    include: { class: { select: { teacherId: true } } },
  });

  if (!subject) return { error: "Subject not found", status: 404 } as const;
  if (subject.class.teacherId !== userId)
    return { error: "You don't own this class", status: 403 } as const;

  return { subject } as const;
}

/**
 * PUT /api/subjects/[subjectId] — Update a subject (name, description)
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can update subjects" }, { status: 403 });
    }

    const { subjectId } = await params;
    const result = await verifySubjectOwnership(subjectId, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const { name, description } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Subject name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description =
        typeof description === "string" && description.trim().length > 0
          ? description.trim()
          : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prismaClient.subject.update({
      where: { id: subjectId },
      data: updateData,
    });

    return NextResponse.json({ subject: updated });
  } catch (err) {
    console.error("Update subject error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * DELETE /api/subjects/[subjectId] — Delete a subject and all its courses/tracks
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can delete subjects" }, { status: 403 });
    }

    const { subjectId } = await params;
    const result = await verifySubjectOwnership(subjectId, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Cascade delete handles courses and tracks via schema onDelete: Cascade
    await prismaClient.subject.delete({
      where: { id: subjectId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete subject error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
