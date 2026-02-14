import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

type RouteParams = { params: Promise<{ subjectId: string }> };

/**
 * Helper: verify subject exists and teacher owns the parent class
 */
async function verifyTeacherOwnsSubject(subjectId: string, userId: string) {
  const subject = await prismaClient.subject.findUnique({
    where: { id: subjectId },
    include: { class: { select: { teacherId: true, id: true } } },
  });

  if (!subject) return { error: "Subject not found", status: 404 } as const;
  if (subject.class.teacherId !== userId)
    return { error: "You don't own this class", status: 403 } as const;

  return { subject } as const;
}

/**
 * POST /api/subjects/[subjectId]/tracks — Create a track
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER")
      return NextResponse.json({ error: "Only teachers can create tracks" }, { status: 403 });

    const { subjectId } = await params;
    const result = await verifyTeacherOwnsSubject(subjectId, session.user.id);
    if ("error" in result)
      return NextResponse.json({ error: result.error }, { status: result.status });

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0)
      return NextResponse.json({ error: "Track name is required" }, { status: 400 });

    const track = await prismaClient.track.create({
      data: {
        id: randomUUID(),
        subjectId,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ track }, { status: 201 });
  } catch (err) {
    console.error("Create track error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * GET /api/subjects/[subjectId]/tracks — List tracks for a subject
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subjectId } = await params;

    const subject = await prismaClient.subject.findUnique({
      where: { id: subjectId },
      include: { class: { select: { teacherId: true, id: true } } },
    });

    if (!subject)
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    // Teachers see all tracks; students see only published
    const isTeacherOwner = subject.class.teacherId === session.user.id;

    if (!isTeacherOwner && session.user.role === "STUDENT") {
      const enrollment = await prismaClient.enrollment.findUnique({
        where: { classId_userId: { classId: subject.class.id, userId: session.user.id } },
      });
      if (!enrollment)
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const tracks = await prismaClient.track.findMany({
      where: {
        subjectId,
        ...(isTeacherOwner ? {} : { isPublished: true }),
      },
      include: {
        _count: { select: { lessons: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ tracks });
  } catch (err) {
    console.error("List tracks error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
