import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * POST /api/classes/[id]/subjects — Teacher creates a subject in a class
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create subjects" },
        { status: 403 }
      );
    }

    const { id: classId } = await params;

    // Verify teacher owns this class
    const classData = await prismaClient.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't own this class" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

    const subject = await prismaClient.subject.create({
      data: {
        id: randomUUID(),
        classId,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (err) {
    console.error("Create subject error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/classes/[id]/subjects — List subjects in a class
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: classId } = await params;

    // Verify user has access to this class (teacher owns it or student enrolled)
    const classData = await prismaClient.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (session.user.role === "TEACHER" && classData.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (session.user.role === "STUDENT") {
      const enrollment = await prismaClient.enrollment.findUnique({
        where: {
          classId_userId: { classId, userId: session.user.id },
        },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const subjects = await prismaClient.subject.findMany({
      where: { classId },
      include: {
        _count: { select: { courses: true, tracks: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ subjects });
  } catch (err) {
    console.error("List subjects error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
