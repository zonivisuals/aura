import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/classes/[id] — Get class details with enrolled members (teacher only)
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const classData = await prismaClient.class.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Only the teacher who owns this class can view details
    if (classData.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ class: classData });
  } catch (err) {
    console.error("Get class error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/classes/[id] — Update class attributes (teacher only)
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can update classes" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify the teacher owns this class
    const existing = await prismaClient.class.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (existing.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    // Build update data — only include fields that were provided
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Class name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description =
        typeof description === "string" && description.trim().length > 0
          ? description.trim()
          : null;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be a boolean" },
          { status: 400 }
        );
      }
      updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await prismaClient.class.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    return NextResponse.json({ class: updated });
  } catch (err) {
    console.error("Update class error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
