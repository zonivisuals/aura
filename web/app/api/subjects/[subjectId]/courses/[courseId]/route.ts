import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

/**
 * DELETE /api/subjects/[subjectId]/courses/[courseId] — Delete a course
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ subjectId: string; courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can delete courses" },
        { status: 403 }
      );
    }

    const { subjectId, courseId } = await params;

    // Verify course exists and teacher owns the parent class
    const course = await prismaClient.course.findUnique({
      where: { id: courseId },
      include: {
        subject: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });

    if (!course || course.subjectId !== subjectId) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.subject.class.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't own this class" },
        { status: 403 }
      );
    }

    // Delete file from disk (best effort)
    try {
      const filePath = path.join(process.cwd(), "public", course.pdfUrl);
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
