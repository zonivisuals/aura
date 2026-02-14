import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const AI_BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

/**
 * POST /api/ai/generate-quiz
 * Teacher uploads a PDF → proxies to the FastAPI backend → returns generated MCQ questions.
 * Body: FormData with a "file" field (PDF).
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER")
      return NextResponse.json(
        { error: "Only teachers can generate quizzes" },
        { status: 403 }
      );

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File))
      return NextResponse.json(
        { error: "A PDF file is required" },
        { status: 400 }
      );

    if (!file.name.toLowerCase().endsWith(".pdf"))
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );

    // Forward to the Python AI backend
    const backendForm = new FormData();
    backendForm.append("file", file);

    const backendRes = await fetch(`${AI_BACKEND}/generate-quiz`, {
      method: "POST",
      body: backendForm,
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text().catch(() => "AI backend error");
      console.error("AI generate-quiz error:", errText);
      return NextResponse.json(
        { error: "AI service failed to generate quiz. Please try again." },
        { status: 502 }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("generate-quiz proxy error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
