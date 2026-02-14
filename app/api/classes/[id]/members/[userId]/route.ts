import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string; userId: string }> };

/**
 * DELETE /api/classes/[id]/members/[userId] — Remove a student from a class (teacher only)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can remove students" },
        { status: 403 }
      );
    }

    const { id: classId, userId } = await params;

    // Verify the teacher owns this class
    const classData = await prismaClient.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find and delete the enrollment
    const enrollment = await prismaClient.enrollment.findUnique({
      where: {
        classId_userId: { classId, userId },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in this class" },
        { status: 404 }
      );
    }

    await prismaClient.enrollment.delete({
      where: { id: enrollment.id },
    });

    return NextResponse.json({ message: "Student removed successfully" });
  } catch (err) {
    console.error("Remove member error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
