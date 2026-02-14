import { auth } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { u, subject } = await req.json();
  const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const response = await fetch(
    `http://localhost:8000/ai/student-tutor/${userId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    }
  );

  const data = await response.json();
  return NextResponse.json(data);
}
