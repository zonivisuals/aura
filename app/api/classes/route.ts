import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Generate a random 6-character uppercase alphanumeric invite code
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Generate a unique invite code (retries on collision)
 */
async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const existing = await prismaClient.class.findUnique({
      where: { inviteCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique invite code");
}

/**
 * POST /api/classes — Teacher creates a new class
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create classes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Class name is required" },
        { status: 400 }
      );
    }

    const inviteCode = await generateUniqueInviteCode();

    const newClass = await prismaClient.class.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        description: description?.trim() || null,
        teacherId: session.user.id,
        inviteCode,
      },
    });

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (err) {
    console.error("Create class error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/classes — List classes for the current user
 * Teachers see classes they created; Students see classes they're enrolled in
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "TEACHER") {
      const classes = await prismaClient.class.findMany({
        where: { teacherId: session.user.id },
        include: {
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ classes });
    }

    // Student: get enrolled classes
    const enrollments = await prismaClient.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        class: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const classes = enrollments.map((e) => ({
      ...e.class,
      enrollmentType: e.enrollmentType,
      joinedAt: e.joinedAt,
    }));

    return NextResponse.json({ classes });
  } catch (err) {
    console.error("List classes error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
