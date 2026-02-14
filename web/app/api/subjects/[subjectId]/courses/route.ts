import { auth } from "@/lib/auth/auth";
import { prismaClient } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "courses");

/**
 * POST /api/subjects/[subjectId]/courses — Upload a PDF course for a subject
 * Expects multipart FormData with:
 *   - file: PDF file
 *   - title: string
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can upload courses" },
        { status: 403 }
      );
    }

    const { subjectId } = await params;

    // Verify subject exists and teacher owns the parent class
    const subject = await prismaClient.subject.findUnique({
      where: { id: subjectId },
      include: { class: { select: { teacherId: true } } },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (subject.class.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't own this class" },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 10 MB" },
        { status: 400 }
      );
    }

    // Save file to disk
    await mkdir(UPLOAD_DIR, { recursive: true });

    const fileId = randomUUID();
    const ext = path.extname(file.name) || ".pdf";
    const savedFilename = `${fileId}${ext}`;
    const filePath = path.join(UPLOAD_DIR, savedFilename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const pdfUrl = `/uploads/courses/${savedFilename}`;

    // Save to database
    const course = await prismaClient.course.create({
      data: {
        id: fileId,
        subjectId,
        title: title.trim(),
        pdfUrl,
        pdfFilename: file.name,
        fileSize: file.size,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (err) {
    console.error("Upload course error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subjects/[subjectId]/courses — List courses for a subject
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectId } = await params;

    // Verify subject exists and user has access to the parent class
    const subject = await prismaClient.subject.findUnique({
      where: { id: subjectId },
      include: { class: { select: { teacherId: true, id: true } } },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (session.user.role === "TEACHER" && subject.class.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (session.user.role === "STUDENT") {
      const enrollment = await prismaClient.enrollment.findUnique({
        where: {
          classId_userId: { classId: subject.class.id, userId: session.user.id },
        },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const courses = await prismaClient.course.findMany({
      where: { subjectId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ courses });
  } catch (err) {
    console.error("List courses error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
