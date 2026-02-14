import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

type RouteParams = { params: Promise<{ subjectId: string; courseId: string }> };

/**
 * Helper: verify course exists and teacher owns the parent class
 */
async function verifyCourseOwnership(subjectId: string, courseId: string, userId: string) {
  const course = await prismaClient.course.findUnique({
    where: { id: courseId },
    include: {
      subject: {
        include: { class: { select: { teacherId: true } } },
      },
    },
  });

  if (!course || course.subjectId !== subjectId) {
    return { error: "Course not found", status: 404 } as const;
  }
  if (course.subject.class.teacherId !== userId) {
    return { error: "You don't own this class", status: 403 } as const;
  }

  return { course } as const;
}

/**
 * PUT /api/subjects/[subjectId]/courses/[courseId] — Update course title
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can update courses" }, { status: 403 });
    }

    const { subjectId, courseId } = await params;
    const result = await verifyCourseOwnership(subjectId, courseId, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const updated = await prismaClient.course.update({
      where: { id: courseId },
      data: { title: title.trim() },
    });

    return NextResponse.json({ course: updated });
  } catch (err) {
    console.error("Update course error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * DELETE /api/subjects/[subjectId]/courses/[courseId] — Delete a course
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can delete courses" }, { status: 403 });
    }

    const { subjectId, courseId } = await params;
    const result = await verifyCourseOwnership(subjectId, courseId, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Delete file from disk (best effort)
    try {
      const filePath = path.join(process.cwd(), "public", result.course.pdfUrl);
      await unlink(filePath);
    } catch {
      // File may not exist, ignore
    }

    // Delete from database
    await prismaClient.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete course error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
