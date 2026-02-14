import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const AI_BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

/**
 * GET /api/ai/recommendations
 * Returns AI-powered track recommendations for the logged-in student,
 * based on collaborative filtering from classmates' activity.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT")
      return NextResponse.json(
        { error: "Only students can get recommendations" },
        { status: 403 }
      );

    const backendRes = await fetch(
      `${AI_BACKEND}/recommendations/${session.user.id}`,
      { method: "GET" }
    );

    if (!backendRes.ok) {
      const errText = await backendRes.text().catch(() => "AI backend error");
      console.error("AI recommendations error:", errText);
      return NextResponse.json(
        { error: "Could not fetch recommendations right now." },
        { status: 502 }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json({ recommendations: data });
  } catch (err) {
    console.error("recommendations proxy error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
