import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const AI_BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

/**
 * POST /api/ai/tutor-quiz
 * AI personal tutor generates a practice quiz targeting the student's weaknesses.
 * Body: { subject: string }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT")
      return NextResponse.json(
        { error: "Only students can use the AI tutor" },
        { status: 403 }
      );

    const body = await request.json();
    const { subject } = body;

    if (!subject || typeof subject !== "string" || !subject.trim())
      return NextResponse.json(
        { error: "A subject is required" },
        { status: 400 }
      );

    const backendRes = await fetch(
      `${AI_BACKEND}/ai/student-tutor/${session.user.id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim() }),
      }
    );

    if (!backendRes.ok) {
      const errText = await backendRes.text().catch(() => "AI backend error");
      console.error("AI tutor-quiz error:", errText);
      return NextResponse.json(
        { error: "AI tutor service is unavailable. Please try again." },
        { status: 502 }
      );
    }

    const data = await backendRes.json();

    // The backend may return { error: "..." } on soft failures
    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: 422 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("tutor-quiz proxy error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
