import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * POST /api/classes/join — Student joins a class via invite code
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can join classes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (
      !inviteCode ||
      typeof inviteCode !== "string" ||
      inviteCode.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    // Case-insensitive lookup, trimmed
    const code = inviteCode.trim().toUpperCase();

    const targetClass = await prismaClient.class.findUnique({
      where: { inviteCode: code },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
      },
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: "Class not found. Check your invite code." },
        { status: 404 }
      );
    }

    if (!targetClass.isActive) {
      return NextResponse.json(
        { error: "This class is no longer active" },
        { status: 403 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prismaClient.enrollment.findUnique({
      where: {
        classId_userId: {
          classId: targetClass.id,
          userId: session.user.id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already a member of this class" },
        { status: 409 }
      );
    }

    // Create enrollment
    await prismaClient.enrollment.create({
      data: {
        id: randomUUID(),
        classId: targetClass.id,
        userId: session.user.id,
        enrollmentType: "STUDENT",
      },
    });

    return NextResponse.json({
      message: "Successfully joined the class!",
      class: {
        id: targetClass.id,
        name: targetClass.name,
        description: targetClass.description,
        teacher: targetClass.teacher,
      },
    });
  } catch (err) {
    console.error("Join class error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
